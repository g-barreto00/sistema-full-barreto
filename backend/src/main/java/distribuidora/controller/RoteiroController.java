package distribuidora.controller;

import distribuidora.enums.FormaPagamento;
import distribuidora.enums.StatusPedido;
import distribuidora.model.Caminhao;
import distribuidora.model.Pedido;
import distribuidora.model.Roteiro;
import distribuidora.service.LoteCarneService;
import distribuidora.service.PedidoService;
import distribuidora.service.RoteiroService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roteiros")
public class RoteiroController {

    private final RoteiroService   roteiroService;
    private final PedidoService    pedidoService;
    private final LoteCarneService loteCarneService;

    public RoteiroController(RoteiroService roteiroService,
                              PedidoService pedidoService,
                              LoteCarneService loteCarneService) {
        this.roteiroService   = roteiroService;
        this.pedidoService    = pedidoService;
        this.loteCarneService = loteCarneService;
    }

    @GetMapping("/caminhoes")
    public List<Caminhao> listarCaminhoes() {
        return roteiroService.listarCaminhoes();
    }

    @PostMapping("/caminhoes")
    public ResponseEntity<Caminhao> cadastrarCaminhao(@RequestBody Map<String, Object> body) {
        String placa = body.get("placa").toString();
        String moto  = body.get("motorista").toString();
        double cap   = Double.parseDouble(body.get("capacidadeMaximaKg").toString());
        return ResponseEntity.ok(roteiroService.cadastrarCaminhao(new Caminhao(placa, moto, cap)));
    }

    @GetMapping
    public List<Roteiro> listarRoteiros(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return data != null ? roteiroService.listarPorData(data) : roteiroService.listarRoteiros();
    }

    @PostMapping
    public ResponseEntity<?> criarRoteiro(@RequestBody Map<String, Object> body) {
        Long      caminhaoId = Long.valueOf(body.get("caminhaoId").toString());
        LocalDate data       = LocalDate.parse(body.get("data").toString());
        return roteiroService.buscarCaminhaoPorId(caminhaoId)
                .map(c -> ResponseEntity.ok(roteiroService.criarRoteiro(c, data)))
                .orElse(ResponseEntity.badRequest().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Roteiro> buscarPorId(@PathVariable Long id) {
        return roteiroService.buscarPorNumero(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/pedidos")
    public ResponseEntity<String> adicionarPedido(@PathVariable Long id,
                                                   @RequestBody Map<String, Long> body) {
        Roteiro roteiro = roteiroService.buscarPorNumero(id).orElse(null);
        if (roteiro == null) return ResponseEntity.notFound().build();

        Pedido pedido = pedidoService.buscarPorNumero(body.get("pedidoId")).orElse(null);
        if (pedido == null) return ResponseEntity.badRequest().body("Pedido não encontrado.");

        boolean ok = roteiroService.adicionarPedido(roteiro, pedido);
        return ok ? ResponseEntity.ok("Pedido adicionado ao roteiro.")
                  : ResponseEntity.badRequest().body("Capacidade insuficiente.");
    }

    @DeleteMapping("/{id}/pedidos/{pedidoId}")
    public ResponseEntity<String> removerPedido(@PathVariable Long id,
                                                 @PathVariable Long pedidoId) {
        Roteiro roteiro = roteiroService.buscarPorNumero(id).orElse(null);
        if (roteiro == null) return ResponseEntity.notFound().build();

        Pedido pedido = pedidoService.buscarPorNumero(pedidoId).orElse(null);
        if (pedido == null) return ResponseEntity.badRequest().body("Pedido não encontrado.");

        roteiroService.removerPedido(roteiro, pedido);
        return ResponseEntity.ok("Pedido removido do roteiro.");
    }

    @PatchMapping("/{id}/finalizar")
    public ResponseEntity<?> finalizar(@PathVariable Long id,
                                        @RequestBody Map<String, Object> body) {
        Roteiro roteiro = roteiroService.buscarPorNumero(id).orElse(null);
        if (roteiro == null) return ResponseEntity.notFound().build();

        if (roteiro.getStatus() == distribuidora.enums.StatusRoteiro.FINALIZADO)
            return ResponseEntity.badRequest().body("Roteiro já finalizado.");

        // Validação de horário — comentado temporariamente para testes
        // int horaAtual = LocalTime.now(ZoneId.of("America/Sao_Paulo")).getHour();
        // if (horaAtual < roteiro.getHorarioMinFinalizacaoHora())
        //     return ResponseEntity.badRequest().body(
        //         "Roteiro só pode ser finalizado após " + roteiro.getHorarioMinFinalizacaoHora() + "h.");

        List<?> pedidosRaw = (List<?>) body.getOrDefault("pedidosEntregues", List.of());

        // ── Validação prévia de carnês ────────────────────────────────────
        for (Object entrada : pedidosRaw) {
            if (entrada instanceof Map<?, ?> map) {
                String fpStr = map.get("formaPagamento") != null
                               ? map.get("formaPagamento").toString() : null;
                if ("CARNE".equals(fpStr)) {
                    Long pedidoId = Long.valueOf(map.get("pedidoId").toString());
                    Pedido p = pedidoService.buscarPorNumero(pedidoId).orElse(null);
                    if (p != null) {
                        int qtdGarrafoes = p.getItens().stream()
                            .filter(ip -> ip.getProduto() == distribuidora.enums.Produto.GARRAFAO_REPOSICAO
                                       || ip.getProduto() == distribuidora.enums.Produto.GARRAFAO_COMPLETO)
                            .mapToInt(distribuidora.model.ItemPedido::getQuantidade)
                            .sum();

                        // Bloqueia carnê se pedido não tem garrafões
                        if (qtdGarrafoes == 0) {
                            return ResponseEntity.badRequest().body(
                                "Pagamento com carnê só é permitido para pedidos de garrafão. " +
                                "O pedido #" + p.getNumeroPedido() + " não contém garrafões.");
                        }

                        int saldo = loteCarneService.saldoTotal(p.getCliente().getId());
                        if (saldo < qtdGarrafoes) {
                            return ResponseEntity.badRequest().body(
                                "Cliente " + p.getCliente().getNome() +
                                " não tem carnês suficientes. Saldo: " + saldo +
                                ", necessário: " + qtdGarrafoes + ".");
                        }
                    }
                }
            }
        }

        // ── Execução ──────────────────────────────────────────────────────
        for (Object entrada : pedidosRaw) {
            if (entrada instanceof Map<?, ?> map) {
                Long   pedidoId = Long.valueOf(map.get("pedidoId").toString());
                String fpStr    = map.get("formaPagamento") != null
                                  ? map.get("formaPagamento").toString() : null;

                pedidoService.buscarPorNumero(pedidoId).ifPresent(p -> {
                    pedidoService.alterarStatus(p, StatusPedido.ENTREGUE);
                    if (fpStr != null) {
                        FormaPagamento fp = FormaPagamento.valueOf(fpStr);
                        p.setFormaPagamento(fp);
                        p.setPago(true);
                        if (fp == FormaPagamento.CARNE) {
                            int qtdGarrafoes = p.getItens().stream()
                                .filter(ip -> ip.getProduto() == distribuidora.enums.Produto.GARRAFAO_REPOSICAO
                                           || ip.getProduto() == distribuidora.enums.Produto.GARRAFAO_COMPLETO)
                                .mapToInt(distribuidora.model.ItemPedido::getQuantidade)
                                .sum();
                            if (qtdGarrafoes > 0)
                                loteCarneService.usarCarnes(p.getCliente().getId(), qtdGarrafoes);
                        }
                    }
                    pedidoService.salvar(p);
                });
            }
        }

        // ── Pedidos não entregues voltam para PENDENTE ────────────────────
        List<Long> entreguesIds = pedidosRaw.stream()
            .filter(i -> i instanceof Map)
            .map(i -> Long.valueOf(((Map<?, ?>) i).get("pedidoId").toString()))
            .toList();

        pedidoService.listarTodos().stream()
            .filter(p -> p.getRoteiro() != null &&
                         p.getRoteiro().getNumeroRoteiro().equals(id) &&
                         !entreguesIds.contains(p.getNumeroPedido()))
            .forEach(p -> pedidoService.alterarStatus(p, StatusPedido.PENDENTE));

        roteiro.setStatus(distribuidora.enums.StatusRoteiro.FINALIZADO);
        roteiroService.salvarRoteiro(roteiro);

        return ResponseEntity.ok(roteiro);
    }

    @PatchMapping("/{id}/confirmar-conferencia")
    public ResponseEntity<?> confirmarConferencia(@PathVariable Long id) {
        Roteiro roteiro = roteiroService.buscarPorNumero(id).orElse(null);
        if (roteiro == null) return ResponseEntity.notFound().build();

        if (roteiro.getStatus() != distribuidora.enums.StatusRoteiro.FINALIZADO)
            return ResponseEntity.badRequest().body("Roteiro precisa estar finalizado primeiro.");

        roteiro.setConferenciaConfirmada(true);
        roteiroService.salvarRoteiro(roteiro);
        return ResponseEntity.ok("Conferência confirmada.");
    }
}