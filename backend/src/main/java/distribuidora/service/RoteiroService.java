package distribuidora.service;

import distribuidora.model.Caminhao;
import distribuidora.model.Pedido;
import distribuidora.model.Roteiro;
import distribuidora.repository.CaminhaoRepository;
import distribuidora.repository.PedidoRepository;
import distribuidora.repository.RoteiroRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Gerencia caminhões e roteiros.
 *
 * Caminhão = cadastro fixo do veículo (placa, motorista, capacidade).
 * Roteiro  = evento do dia: um caminhão + uma data + os pedidos alocados.
 *
 * Como Pedido é o dono da FK roteiro_id (decisão 2B), salvar o Pedido
 * é suficiente para persistir o vínculo com o Roteiro.
 */
@Service
public class RoteiroService {

    private final RoteiroRepository  roteiroRepository;
    private final CaminhaoRepository caminhaoRepository;
    private final PedidoRepository   pedidoRepository;

    public RoteiroService(RoteiroRepository roteiroRepository,
                          CaminhaoRepository caminhaoRepository,
                          PedidoRepository pedidoRepository) {
        this.roteiroRepository  = roteiroRepository;
        this.caminhaoRepository = caminhaoRepository;
        this.pedidoRepository   = pedidoRepository;
    }

    // ── Caminhões ─────────────────────────────────────────────────────────────

    @Transactional
    public Caminhao cadastrarCaminhao(Caminhao caminhao) {
        Caminhao salvo = caminhaoRepository.save(caminhao);
        System.out.println("Caminhão " + salvo.getPlaca() + " cadastrado.");
        return salvo;
    }

    @Transactional(readOnly = true)
    public List<Caminhao> listarCaminhoes() {
        return caminhaoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Caminhao> buscarCaminhaoPorId(Long id) {
        return caminhaoRepository.findById(id);
    }

    // ── Roteiros ──────────────────────────────────────────────────────────────

    @Transactional
    public Roteiro criarRoteiro(Caminhao caminhao, LocalDate data) {
        Roteiro roteiro = new Roteiro(caminhao, data);
        Roteiro salvo = roteiroRepository.save(roteiro);
        System.out.printf("Roteiro #%d criado: %s em %s%n",
                salvo.getNumeroRoteiro(),
                caminhao.getPlaca(),
                data.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        return salvo;
    }

    @Transactional
    public boolean adicionarPedido(Roteiro roteiro, Pedido pedido) {
        // Recarrega o roteiro para refletir pedidos já persistidos
        Roteiro r = roteiroRepository.findById(roteiro.getNumeroRoteiro())
                .orElseThrow(() -> new IllegalArgumentException("Roteiro não encontrado."));
        boolean adicionado = r.adicionarPedido(pedido);
        if (adicionado) {
            pedidoRepository.save(pedido);
        }
        return adicionado;
    }

    @Transactional
    public void removerPedido(Roteiro roteiro, Pedido pedido) {
        Roteiro r = roteiroRepository.findById(roteiro.getNumeroRoteiro())
                .orElseThrow(() -> new IllegalArgumentException("Roteiro não encontrado."));
        r.removerPedido(pedido);
        pedidoRepository.save(pedido);
    }

    @Transactional(readOnly = true)
    public List<Roteiro> listarRoteiros() {
        return roteiroRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Roteiro> listarPorData(LocalDate data) {
        return roteiroRepository.findByData(data);
    }

    @Transactional(readOnly = true)
    public List<Roteiro> listarPorCaminhao(Caminhao caminhao) {
        return roteiroRepository.findByCaminhao(caminhao);
    }

    @Transactional(readOnly = true)
    public Optional<Roteiro> buscarPorNumero(Long numero) {
        return roteiroRepository.findById(numero);
    }

    // Aliases mantidos para compatibilidade com controllers
    @Transactional(readOnly = true)
    public List<Caminhao> getCaminhoes() { return caminhaoRepository.findAll(); }

    @Transactional(readOnly = true)
    public List<Roteiro>  getRoteiros()  { return roteiroRepository.findAll(); }

    @Transactional
    public Roteiro salvarRoteiro(Roteiro roteiro) {
    return roteiroRepository.save(roteiro);
}
}
