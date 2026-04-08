package distribuidora.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import distribuidora.enums.Produto;
import distribuidora.enums.StatusPedido;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pedidos")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Pedido {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long numeroPedido;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roteiro_id")
    private Roteiro roteiro;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true,
               fetch = FetchType.EAGER)
    private List<ItemPedido> itens = new ArrayList<>();

    private LocalDate    dataPedido;
    private double       valorTotal;
    private double       pesoTotal;

    @Enumerated(EnumType.STRING)
    private StatusPedido status;

    // ── Construtores ──────────────────────────────────────────────────────────

    protected Pedido() {}

    public Pedido(Cliente cliente) {
        this.cliente    = cliente;
        this.dataPedido = LocalDate.now();
        this.status     = StatusPedido.PENDENTE;
    }

    // ── Itens ─────────────────────────────────────────────────────────────────

    public void adicionarItem(Produto produto, int quantidade) {
        if (status == StatusPedido.CANCELADO) {
            System.out.println("Pedido cancelado não aceita novos itens.");
            return;
        }
        for (ItemPedido item : itens) {
            if (item.getProduto() == produto) {
                item.setQuantidade(item.getQuantidade() + quantidade);
                recalcular();
                return;
            }
        }
        ItemPedido novo = new ItemPedido(produto, quantidade);
        novo.setPedido(this);
        itens.add(novo);
        recalcular();
    }

    // ── Cálculos ──────────────────────────────────────────────────────────────

    private void recalcular() {
        calcularValorTotal();
        calcularPesoTotal();
    }

    public double calcularValorTotal() {
        this.valorTotal = itens.stream().mapToDouble(ItemPedido::getSubtotal).sum();
        return this.valorTotal;
    }

    public double calcularPesoTotal() {
        this.pesoTotal = itens.stream().mapToDouble(ItemPedido::getPesoTotal).sum();
        return this.pesoTotal;
    }

    // ── Cancelamento ──────────────────────────────────────────────────────────

    public boolean cancelar() {
        if (status == StatusPedido.PENDENTE) {
            status = StatusPedido.CANCELADO;
            return true;
        }
        System.out.println("Pedido #" + numeroPedido + " não pode ser cancelado (status: " + status.getDescricao() + ").");
        return false;
    }

    // ── Exibir ────────────────────────────────────────────────────────────────

    public void exibirResumo() {
        System.out.println("╔══════════════════════════════════════════════╗");
        System.out.printf ("  Pedido #%-4d  %s%n", numeroPedido, dataPedido.format(FMT));
        System.out.println("  Cliente : " + cliente.getNome() + " / " + cliente.getBairro());
        System.out.println("  Status  : " + status.getDescricao());
        System.out.println("────────────────────────────────────────────────");
        itens.forEach(System.out::println);
        System.out.println("────────────────────────────────────────────────");
        System.out.printf ("  Valor total : R$ %.2f%n", valorTotal);
        System.out.printf ("  Peso total  : %.2f kg%n", pesoTotal);
        System.out.println("╚══════════════════════════════════════════════╝");
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    public Long             getNumeroPedido() { return numeroPedido; }
    public Cliente          getCliente()      { return cliente; }
    public Roteiro          getRoteiro()      { return roteiro; }
    public void             setRoteiro(Roteiro r) { this.roteiro = r; }
    public List<ItemPedido> getItens()        { return itens; }
    public double           getValorTotal()   { return valorTotal; }
    public double           getPesoTotal()    { return pesoTotal; }
    public LocalDate        getDataPedido()   { return dataPedido; }
    public StatusPedido     getStatus()       { return status; }
    public void             setStatus(StatusPedido s) { this.status = s; }

    @Override
    public String toString() {
        return String.format("Pedido #%d | %s | %-20s | R$ %7.2f | %5.1f kg | %s",
                numeroPedido, dataPedido.format(FMT), cliente.getNome(),
                valorTotal, pesoTotal, status.getDescricao());
    }
}
