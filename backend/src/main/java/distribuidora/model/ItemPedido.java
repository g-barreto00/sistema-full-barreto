package distribuidora.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import distribuidora.enums.Produto;
import jakarta.persistence.*;

@Entity
@Table(name = "itens_pedido")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ItemPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @Enumerated(EnumType.STRING)
    private Produto produto;

    private int    quantidade;
    private double subtotal;
    private double pesoTotal;

    // ── Construtores ──────────────────────────────────────────────────────────

    protected ItemPedido() {}

    public ItemPedido(Produto produto, int quantidade) {
        this.produto    = produto;
        this.quantidade = quantidade;
        calcularSubtotal();
        calcularPesoTotal();
    }

    // ── Cálculos ──────────────────────────────────────────────────────────────

    public double calcularSubtotal() {
        this.subtotal = produto.getPreco() * quantidade;
        return this.subtotal;
    }

    public double calcularPesoTotal() {
        this.pesoTotal = produto.getPesoEmKg() * quantidade;
        return this.pesoTotal;
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    public Long    getId()         { return id; }
    public Pedido  getPedido()     { return pedido; }
    public void    setPedido(Pedido p) { this.pedido = p; }
    public Produto getProduto()    { return produto; }
    public int     getQuantidade() { return quantidade; }
    public double  getSubtotal()   { return subtotal; }
    public double  getPesoTotal()  { return pesoTotal; }

    public void setQuantidade(int quantidade) {
        this.quantidade = quantidade;
        calcularSubtotal();
        calcularPesoTotal();
    }

    @Override
    public String toString() {
        return String.format("  %-30s %3dx  R$ %6.2f  %5.1f kg",
                produto.getNome(), quantidade, subtotal, pesoTotal);
    }
}
