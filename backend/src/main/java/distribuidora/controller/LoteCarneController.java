package distribuidora.controller;

import distribuidora.model.Cliente;
import distribuidora.model.LoteCarne;
import distribuidora.service.ClienteService;
import distribuidora.service.LoteCarneService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/carnes")
public class LoteCarneController {

    private final LoteCarneService loteCarneService;
    private final ClienteService   clienteService;

    public LoteCarneController(LoteCarneService loteCarneService, ClienteService clienteService) {
        this.loteCarneService = loteCarneService;
        this.clienteService   = clienteService;
    }

    /** GET /api/carnes?clienteId= */
    @GetMapping
    public ResponseEntity<?> listar(@RequestParam Long clienteId) {
        return ResponseEntity.ok(loteCarneService.listarPorCliente(clienteId));
    }

    /** GET /api/carnes/saldo?clienteId= */
    @GetMapping("/saldo")
    public ResponseEntity<?> saldo(@RequestParam Long clienteId) {
        return ResponseEntity.ok(Map.of("saldo", loteCarneService.saldoTotal(clienteId)));
    }

    /**
     * POST /api/carnes
     * Body: { "clienteId": 1, "quantidade": 15, "dataCompra": "2026-04-20", "observacao": "..." }
     */
    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Map<String, Object> body) {
        try {
            Long      clienteId  = Long.valueOf(body.get("clienteId").toString());
            int       quantidade = Integer.parseInt(body.get("quantidade").toString());
            LocalDate data       = LocalDate.parse(body.get("dataCompra").toString());
            String    obs        = body.getOrDefault("observacao", "").toString();

            Cliente cliente = clienteService.buscarPorId(clienteId)
                    .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado."));

            return ResponseEntity.ok(loteCarneService.criar(cliente, quantidade, data, obs));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * PATCH /api/carnes/{id}/usar
     * Body: { "quantidade": 3 }
     */
    @PatchMapping("/{id}/usar")
    public ResponseEntity<?> usar(@PathVariable Long id,
                                   @RequestBody Map<String, Integer> body) {
        try {
            LoteCarne lote = loteCarneService.buscarPorId(id)
                    .orElseThrow(() -> new IllegalArgumentException("Lote não encontrado."));
            int quantidade = body.get("quantidade");
            lote.usar(quantidade);
            return ResponseEntity.ok(lote);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}