package distribuidora.service;

import distribuidora.enums.Produto;
import distribuidora.model.Estoque;
import distribuidora.model.ItemPedido;
import distribuidora.model.Pedido;
import distribuidora.repository.EstoqueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EstoqueService {

    private final EstoqueRepository estoqueRepository;

    public EstoqueService(EstoqueRepository estoqueRepository) {
        this.estoqueRepository = estoqueRepository;
    }

    // ── Inicialização ─────────────────────────────────────────────────────────

    @Transactional
    public void inicializar(Produto produto, int quantidade) {
        estoqueRepository.save(new Estoque(produto, quantidade));
    }

    // ── Consultas ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public int consultarEstoque(Produto produto) {
        return estoqueRepository.findById(produto)
                .map(Estoque::getQuantidade)
                .orElse(0);
    }

    @Transactional(readOnly = true)
    public boolean temEstoqueSuficiente(List<ItemPedido> itens) {
        for (ItemPedido item : itens) {
            int disponivel = consultarEstoque(item.getProduto());
            if (disponivel < item.getQuantidade()) {
                System.out.printf(
                    "Estoque insuficiente: %s — disponível: %d, solicitado: %d%n",
                    item.getProduto().getNome(), disponivel, item.getQuantidade()
                );
                return false;
            }
        }
        return true;
    }

    // ── Movimentações ─────────────────────────────────────────────────────────

    @Transactional
    public void baixar(Produto produto, int quantidade) {
        Estoque e = estoqueRepository.findById(produto)
                .orElseThrow(() -> new IllegalStateException(
                        "Produto sem registro de estoque: " + produto));
        if (quantidade > e.getQuantidade()) {
            throw new IllegalStateException(
                    "Tentativa de baixa maior que o estoque: " + produto.getNome());
        }
        e.setQuantidade(e.getQuantidade() - quantidade);
        estoqueRepository.save(e);
    }

    @Transactional
    public void repor(Produto produto, int quantidade) {
        Estoque e = estoqueRepository.findById(produto)
                .orElse(new Estoque(produto, 0));
        e.setQuantidade(e.getQuantidade() + quantidade);
        estoqueRepository.save(e);
    }

    @Transactional
    public void baixarPedido(Pedido pedido) {
        pedido.getItens().forEach(item -> baixar(item.getProduto(), item.getQuantidade()));
    }

    @Transactional
    public void reporPedido(Pedido pedido) {
        pedido.getItens().forEach(item -> repor(item.getProduto(), item.getQuantidade()));
        System.out.println("Estoque reposto para pedido #" + pedido.getNumeroPedido());
    }

    // ── Exibir ────────────────────────────────────────────────────────────────

    public void exibirEstoque() {
        System.out.println("══════════════════════════════════════════════════");
        System.out.println("  ESTOQUE ATUAL");
        System.out.println("──────────────────────────────────────────────────");
        for (Produto p : Produto.values()) {
            int qtd = consultarEstoque(p);
            String alerta = qtd == 0 ? " *** SEM ESTOQUE ***" : (qtd <= 5 ? " (baixo)" : "");
            System.out.printf("  [%s] %-30s %4d un.%s%n",
                    p.getCodigoProduto(), p.getNome(), qtd, alerta);
        }
        System.out.println("══════════════════════════════════════════════════");
    }
}
