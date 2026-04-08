package distribuidora.controller;

import distribuidora.model.Caminhao;
import distribuidora.model.Pedido;
import distribuidora.model.Roteiro;
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

    private final RoteiroService roteiroService;
    private final PedidoService  pedidoService;

    public RoteiroController(RoteiroService roteiroService, PedidoService pedidoService) {
        this.roteiroService = roteiroService;
        this.pedidoService  = pedidoService;
    }

    // ── Caminhões ─────────────────────────────────────────────────────────────

    /** GET /api/roteiros/caminhoes */
    @GetMapping("/caminhoes")
    public List<Caminhao> listarCaminhoes() {
        return roteiroService.listarCaminhoes();
    }

    /**
     * POST /api/roteiros/caminhoes
     * Body: { "placa":"BRA-2E19", "motorista":"Carlos", "capacidadeMaximaKg":1000 }
     */
    @PostMapping("/caminhoes")
    public ResponseEntity<Caminhao> cadastrarCaminhao(@RequestBody Map<String, Object> body) {
        String placa = body.get("placa").toString();
        String moto  = body.get("motorista").toString();
        double cap   = Double.parseDouble(body.get("capacidadeMaximaKg").toString());
        return ResponseEntity.ok(roteiroService.cadastrarCaminhao(new Caminhao(placa, moto, cap)));
    }

    // ── Roteiros ──────────────────────────────────────────────────────────────

    /** GET /api/roteiros  ou  GET /api/roteiros?data=2025-04-08 */
    @GetMapping
    public List<Roteiro> listarRoteiros(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return data != null ? roteiroService.listarPorData(data) : roteiroService.listarRoteiros();
    }

    /**
     * POST /api/roteiros
     * Body: { "caminhaoId": 1, "data": "2025-04-08" }
     */
    @PostMapping
    public ResponseEntity<?> criarRoteiro(@RequestBody Map<String, Object> body) {
        Long      caminhaoId = Long.valueOf(body.get("caminhaoId").toString());
        LocalDate data       = LocalDate.parse(body.get("data").toString());

        return roteiroService.buscarCaminhaoPorId(caminhaoId)
                .map(c -> ResponseEntity.ok(roteiroService.criarRoteiro(c, data)))
                .orElse(ResponseEntity.badRequest().build());
    }

    /** GET /api/roteiros/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<Roteiro> buscarPorId(@PathVariable Long id) {
        return roteiroService.buscarPorNumero(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/roteiros/{id}/pedidos
     * Body: { "pedidoId": 2 }
     */
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

    /** DELETE /api/roteiros/{id}/pedidos/{pedidoId} */
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
}
