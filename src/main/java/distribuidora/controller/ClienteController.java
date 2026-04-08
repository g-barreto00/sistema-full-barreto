package distribuidora.controller;

import distribuidora.model.Cliente;
import distribuidora.service.ClienteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    /** GET /api/clientes — lista apenas ativos */
    @GetMapping
    public List<Cliente> listarAtivos() {
        return clienteService.listarAtivos();
    }

    /** GET /api/clientes/todos — lista todos (ativos + inativos) */
    @GetMapping("/todos")
    public List<Cliente> listarTodos() {
        return clienteService.listarTodos();
    }

    /** GET /api/clientes/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<Cliente> buscarPorId(@PathVariable Long id) {
        return clienteService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/clientes/buscar?q=termo — busca por nome, doc, tel, bairro */
    @GetMapping("/buscar")
    public List<Cliente> buscar(@RequestParam String q) {
        return clienteService.buscarPor(q);
    }

    /**
     * POST /api/clientes
     * Body: { "tipo":"CPF|CNPJ", "nome":"...", "documento":"...",
     *         "endereco":"...", "bairro":"...", "telefone":"...",
     *         "razaoSocial":"..." (opcional), "pontoReferencia":"..." (opcional) }
     */
    @PostMapping
    public ResponseEntity<Cliente> cadastrar(@RequestBody Map<String, String> body) {
        String tipo      = body.getOrDefault("tipo", "CPF");
        String nome      = body.get("nome");
        String documento = body.get("documento");
        String endereco  = body.get("endereco");
        String bairro    = body.get("bairro");
        String telefone  = body.get("telefone");
        String razao     = body.get("razaoSocial");
        String ref       = body.get("pontoReferencia");

        Cliente c = "CNPJ".equalsIgnoreCase(tipo)
                ? new Cliente(nome, documento, razao, endereco, bairro, telefone)
                : new Cliente(nome, documento, endereco, bairro, telefone);

        if (ref != null && !ref.isBlank()) c.setPontoReferencia(ref);

        return ResponseEntity.ok(clienteService.cadastrar(c));
    }

    /** PATCH /api/clientes/{id}/toggle — ativa ou desativa */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<String> toggleAtivo(@PathVariable Long id) {
        return clienteService.buscarPorId(id).map(c -> {
            if (c.isAtivo()) clienteService.desativar(c);
            else             clienteService.reativar(c);
            return ResponseEntity.ok(c.isAtivo() ? "reativado" : "desativado");
        }).orElse(ResponseEntity.notFound().build());
    }
}
