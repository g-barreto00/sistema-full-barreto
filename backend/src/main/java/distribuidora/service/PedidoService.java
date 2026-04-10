package distribuidora.service;

import distribuidora.enums.StatusPedido;
import distribuidora.model.Cliente;
import distribuidora.model.ItemPedido;
import distribuidora.model.Pedido;
import distribuidora.repository.PedidoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Centraliza a lógica de criação e cancelamento de pedidos.
 *
 * Fluxo de emissão:
 *   1. Verifica se o cliente está ativo
 *   2. Verifica se há estoque suficiente para todos os itens
 *   3. Cria o Pedido e adiciona os itens
 *   4. Baixa o estoque
 *   5. Persiste o pedido (cascata salva os ItemPedido)
 *
 * Fluxo de cancelamento:
 *   1. Tenta cancelar o pedido (só PENDENTE pode ser cancelado)
 *   2. Se cancelado, repõe o estoque e persiste
 */
@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final EstoqueService   estoqueService;

    public PedidoService(PedidoRepository pedidoRepository, EstoqueService estoqueService) {
        this.pedidoRepository = pedidoRepository;
        this.estoqueService   = estoqueService;
    }

    // ── Emissão ───────────────────────────────────────────────────────────────

    @Transactional
    public Pedido emitirPedido(Cliente cliente, List<ItemPedido> itens) {
        if (!cliente.isAtivo()) {
            System.out.println("Pedido recusado: cliente inativo.");
            return null;
        }
        if (!estoqueService.temEstoqueSuficiente(itens)) {
            System.out.println("Pedido recusado: estoque insuficiente.");
            return null;
        }

        Pedido pedido = new Pedido(cliente);
        itens.forEach(item -> pedido.adicionarItem(item.getProduto(), item.getQuantidade()));

        estoqueService.baixarPedido(pedido);

        Pedido salvo = pedidoRepository.save(pedido);
        cliente.adicionarPedido(salvo);

        System.out.printf("Pedido #%d emitido. Valor: R$ %.2f | Peso: %.1f kg%n",
                salvo.getNumeroPedido(), salvo.getValorTotal(), salvo.getPesoTotal());
        return salvo;
    }

    // ── Cancelamento ──────────────────────────────────────────────────────────

    @Transactional
    public boolean cancelarPedido(Pedido pedido) {
        boolean cancelado = pedido.cancelar();
        if (cancelado) {
            estoqueService.reporPedido(pedido);
            pedidoRepository.save(pedido);
        }
        return cancelado;
    }

    // ── Alteração de status ───────────────────────────────────────────────────

    @Transactional
    public void alterarStatus(Pedido pedido, StatusPedido novoStatus) {
        if (novoStatus == StatusPedido.CANCELADO) {
            cancelarPedido(pedido);
            return;
        }
        pedido.setStatus(novoStatus);
        pedidoRepository.save(pedido);
        System.out.println("Status do pedido #" + pedido.getNumeroPedido()
                + " atualizado para: " + novoStatus.getDescricao());
    }

    // ── Consultas ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Pedido> listarTodos() {
        return pedidoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Pedido> buscarPorNumero(Long numero) {
        return pedidoRepository.findById(numero);
    }

    @Transactional(readOnly = true)
    public List<Pedido> listarPorCliente(Cliente cliente) {
        return pedidoRepository.findByCliente(cliente);
    }

    @Transactional(readOnly = true)
    public List<Pedido> getTodosPedidos() {
        return pedidoRepository.findAll();
    }
}
