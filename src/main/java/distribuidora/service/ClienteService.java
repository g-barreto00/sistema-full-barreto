package distribuidora.service;

import distribuidora.model.Cliente;
import distribuidora.repository.ClienteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @Transactional
    public Cliente cadastrar(Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    @Transactional(readOnly = true)
    public List<Cliente> listarAtivos() {
        return clienteRepository.findByAtivoTrue();
    }

    @Transactional(readOnly = true)
    public List<Cliente> listarTodos() {
        return clienteRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Cliente> buscarPorId(Long id) {
        return clienteRepository.findById(id);
    }

    // ── Busca ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Cliente> buscarPor(String termo) {
        return clienteRepository.findAll().stream()
                .filter(c -> c.buscarPor(termo))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Cliente> buscarPorBairro(String bairro) {
        return clienteRepository.findByBairroIgnoreCase(bairro);
    }

    @Transactional(readOnly = true)
    public List<Cliente> buscarPorTelefone(String telefone) {
        String t = telefone.replaceAll("[^0-9]", "");
        return clienteRepository.findAll().stream()
                .filter(c -> c.getTelefone().replaceAll("[^0-9]", "").contains(t))
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<Cliente> buscarPorDocumento(String documento) {
        String limpo = documento.replaceAll("[.\\-/]", "");
        return clienteRepository.findAll().stream()
                .filter(c -> c.getDocumento().replaceAll("[.\\-/]", "").equals(limpo))
                .findFirst();
    }

    // ── Exclusão lógica ───────────────────────────────────────────────────────

    @Transactional
    public void desativar(Cliente c) {
        c.desativar();
        clienteRepository.save(c);
    }

    @Transactional
    public void reativar(Cliente c) {
        c.reativar();
        clienteRepository.save(c);
    }
}
