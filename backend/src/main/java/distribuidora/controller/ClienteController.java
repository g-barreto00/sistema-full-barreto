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

    /** GET /api/clientes/buscar?q=termo */
    @GetMapping("/buscar")
    public List<Cliente> buscar(@RequestParam String q) {
        return clienteService.buscarPor(q);
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody Map<String, String> body) {
        String tipo                = body.getOrDefault("tipo", "CPF");
        String nome                = body.get("nome");
        String documento           = body.get("documento");
        String endereco            = body.get("endereco");
        String bairro              = body.get("bairro");
        String telefone            = body.get("telefone");
        String razao               = body.get("razaoSocial");
        String ref                 = body.get("pontoReferencia");
        String cep                 = body.get("cep");
        String responsavelPedidos  = body.get("responsavelPedidos");

        // ── Campos obrigatórios para todos ────────────────────────────────
        if (nome == null || nome.isBlank())
            return ResponseEntity.badRequest().body("Nome é obrigatório.");
        if (endereco == null || endereco.isBlank())
            return ResponseEntity.badRequest().body("Endereço é obrigatório.");
        if (bairro == null || bairro.isBlank())
            return ResponseEntity.badRequest().body("Bairro é obrigatório.");
        if (telefone == null || telefone.isBlank())
            return ResponseEntity.badRequest().body("Telefone é obrigatório.");
        if (cep == null || cep.isBlank())
            return ResponseEntity.badRequest().body("CEP é obrigatório.");

        // ── Campos obrigatórios só para CNPJ ──────────────────────────────
        if ("CNPJ".equalsIgnoreCase(tipo)) {
            if (documento == null || documento.isBlank())
                return ResponseEntity.badRequest().body("CNPJ é obrigatório.");
            if (razao == null || razao.isBlank())
                return ResponseEntity.badRequest().body("Razão Social é obrigatória.");
            if (responsavelPedidos == null || responsavelPedidos.isBlank())
                return ResponseEntity.badRequest().body("Responsável por pedidos é obrigatório.");
        }

        Cliente c = "CNPJ".equalsIgnoreCase(tipo)
                ? new Cliente(nome, documento, razao, endereco, bairro, telefone)
                : new Cliente(nome, documento, endereco, bairro, telefone);

        if (ref != null && !ref.isBlank())
            c.setPontoReferencia(ref);
        if (cep != null && !cep.isBlank())
            c.setCep(cep);
        if (responsavelPedidos != null && !responsavelPedidos.isBlank())
            c.setResponsavelPedidos(responsavelPedidos);

        return ResponseEntity.ok(clienteService.cadastrar(c));
    }

    /** PATCH /api/clientes/{id}/toggle — ativa ou desativa */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<String> toggleAtivo(@PathVariable Long id) {
        return clienteService.buscarPorId(id).map(c -> {
            boolean eraAtivo = c.isAtivo();
            if (eraAtivo) clienteService.desativar(c);
            else          clienteService.reativar(c);
            String msg = eraAtivo ? "desativado" : "reativado";
            return ResponseEntity.ok(msg);
        }).orElse(ResponseEntity.notFound().build());
    }
}