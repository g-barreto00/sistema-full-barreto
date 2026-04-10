package distribuidora.controller;

import distribuidora.model.Bairro;
import distribuidora.repository.BairroRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bairros")
public class BairroController {

    private final BairroRepository bairroRepository;

    public BairroController(BairroRepository bairroRepository) {
        this.bairroRepository = bairroRepository;
    }

    @GetMapping
    public List<Bairro> listar() {
        return bairroRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Map<String, String> body) {
        String nome = body.get("nome");
        if (nome == null || nome.isBlank())
            return ResponseEntity.badRequest().body("Nome obrigatório.");
        if (bairroRepository.existsByNomeIgnoreCase(nome.trim()))
            return ResponseEntity.badRequest().body("Bairro já cadastrado.");
        return ResponseEntity.ok(bairroRepository.save(new Bairro(nome.trim())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        if (!bairroRepository.existsById(id))
            return ResponseEntity.notFound().build();
        bairroRepository.deleteById(id);
        return ResponseEntity.ok("Bairro removido.");
    }
}