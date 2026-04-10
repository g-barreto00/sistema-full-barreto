package distribuidora.controller;

import distribuidora.enums.Produto;
import distribuidora.enums.StatusPedido;
import distribuidora.model.Cliente;
import distribuidora.model.ItemPedido;
import distribuidora.model.Pedido;
import distribuidora.service.ClienteService;
import distribuidora.service.PedidoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoService  pedidoService;
    private final ClienteService clienteService;

    public PedidoController(PedidoService pedidoService, ClienteService clienteService) {
        this.pedidoService  = pedidoService;
        this.clienteService = clienteService;
    }

    /** GET /api/pedidos */
    @GetMapping
    public List<Pedido> listarTodos() {
        return pedidoService.listarTodos();
    }

    /** GET /api/pedidos/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<Pedido> buscarPorId(@PathVariable Long id) {
        return pedidoService.buscarPorNumero(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/pedidos
     * Body: { "clienteId": 1,
     *         "itens": [ { "produto": "GARRAFAO_REPOSICAO", "quantidade": 3 } ] }
     */
    @PostMapping
    public ResponseEntity<?> emitirPedido(@RequestBody Map<String, Object> body) {
        Long clienteId = Long.valueOf(body.get("clienteId").toString());

        Cliente cliente = clienteService.buscarPorId(clienteId).orElse(null);
        if (cliente == null) return ResponseEntity.badRequest().body("Cliente não encontrado.");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> itensBody = (List<Map<String, Object>>) body.get("itens");

        List<ItemPedido> itens = itensBody.stream().map(i -> {
            Produto produto   = Produto.valueOf(i.get("produto").toString());
            int     quantidade = Integer.parseInt(i.get("quantidade").toString());
            return new ItemPedido(produto, quantidade);
        }).toList();

        Pedido pedido = pedidoService.emitirPedido(cliente, itens);
        if (pedido == null) return ResponseEntity.badRequest().body("Pedido recusado.");
        return ResponseEntity.ok(pedido);
    }

    /**
     * PATCH /api/pedidos/{id}/status
     * Body: { "status": "ENTREGUE" }
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> alterarStatus(@PathVariable Long id,
                                           @RequestBody Map<String, String> body) {
        return pedidoService.buscarPorNumero(id).map(p -> {
            StatusPedido novo;
            try { novo = StatusPedido.valueOf(body.get("status")); }
            catch (Exception e) { return ResponseEntity.badRequest().body("Status inválido."); }
            pedidoService.alterarStatus(p, novo);
            return ResponseEntity.ok(p);
        }).orElse(ResponseEntity.notFound().build());
    }

    /** DELETE /api/pedidos/{id} — cancela o pedido */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> cancelar(@PathVariable Long id) {
        return pedidoService.buscarPorNumero(id).map(p -> {
            boolean ok = pedidoService.cancelarPedido(p);
            return ok ? ResponseEntity.ok("Pedido cancelado.")
                      : ResponseEntity.badRequest().body("Pedido não pode ser cancelado.");
        }).orElse(ResponseEntity.notFound().build());
    }
}
