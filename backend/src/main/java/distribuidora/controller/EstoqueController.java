package distribuidora.controller;

import distribuidora.enums.Produto;
import distribuidora.model.Estoque;
import distribuidora.repository.EstoqueRepository;
import distribuidora.service.EstoqueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/estoque")
public class EstoqueController {

    private final EstoqueService    estoqueService;
    private final EstoqueRepository estoqueRepository;

    public EstoqueController(EstoqueService estoqueService,
                              EstoqueRepository estoqueRepository) {
        this.estoqueService    = estoqueService;
        this.estoqueRepository = estoqueRepository;
    }

    /** GET /api/estoque */
    @GetMapping
    public List<Estoque> listar() {
        return estoqueRepository.findAll();
    }

    /**
     * POST /api/estoque/repor
     * Body: { "produto": "GARRAFAO_REPOSICAO", "quantidade": 10 }
     */
    @PostMapping("/repor")
    public ResponseEntity<?> repor(@RequestBody Map<String, Object> body) {
        try {
            Produto produto   = Produto.valueOf(body.get("produto").toString());
            int     quantidade = Integer.parseInt(body.get("quantidade").toString());
            estoqueService.repor(produto, quantidade);
            return ResponseEntity.ok("Estoque reposto.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}