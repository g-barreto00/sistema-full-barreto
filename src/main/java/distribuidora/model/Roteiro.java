package distribuidora.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "roteiros")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Roteiro {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long numeroRoteiro;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "caminhao_id", nullable = false)
    private Caminhao caminhao;

    private LocalDate data;

    // Pedido é o dono da FK roteiro_id — esta é a face inversa
    @OneToMany(mappedBy = "roteiro", fetch = FetchType.LAZY)
    private List<Pedido> pedidos = new ArrayList<>();

    // ── Construtores ──────────────────────────────────────────────────────────

    protected Roteiro() {}

    public Roteiro(Caminhao caminhao, LocalDate data) {
        this.caminhao = caminhao;
        this.data     = data;
    }

    // ── Gestão de pedidos ─────────────────────────────────────────────────────

    public boolean adicionarPedido(Pedido pedido) {
        double pesoFuturo = calcularPesoTotal() + pedido.getPesoTotal();

        if (pesoFuturo > caminhao.getCapacidadeMaximaKg()) {
            System.out.printf(
                "Pedido #%d não adicionado: %.1f kg atual + %.1f kg do pedido = %.1f kg > capacidade %.1f kg%n",
                pedido.getNumeroPedido(),
                calcularPesoTotal(),
                pedido.getPesoTotal(),
                pesoFuturo,
                caminhao.getCapacidadeMaximaKg()
            );
            return false;
        }

        pedido.setRoteiro(this);
        pedidos.add(pedido);
        System.out.printf("Pedido #%d adicionado ao roteiro #%d. Peso: %.1f / %.1f kg%n",
                pedido.getNumeroPedido(), numeroRoteiro,
                calcularPesoTotal(), caminhao.getCapacidadeMaximaKg());
        return true;
    }

    public boolean removerPedido(Pedido pedido) {
        boolean removido = pedidos.remove(pedido);
        if (removido) {
            pedido.setRoteiro(null);
            System.out.printf("Pedido #%d removido do roteiro #%d.%n",
                    pedido.getNumeroPedido(), numeroRoteiro);
        } else {
            System.out.println("Pedido não encontrado neste roteiro.");
        }
        return removido;
    }

    // ── Cálculos ──────────────────────────────────────────────────────────────

    public double calcularPesoTotal() {
        return pedidos.stream().mapToDouble(Pedido::getPesoTotal).sum();
    }

    public double calcularValorTotal() {
        return pedidos.stream().mapToDouble(Pedido::getValorTotal).sum();
    }

    public double calcularCapacidadeDisponivel() {
        return caminhao.getCapacidadeMaximaKg() - calcularPesoTotal();
    }

    // ── Exibir ────────────────────────────────────────────────────────────────

    public void exibirRoteiro() {
        System.out.println("╔══════════════════════════════════════════════════╗");
        System.out.printf ("  Roteiro #%d  —  %s%n", numeroRoteiro, data.format(FMT));
        System.out.printf ("  Caminhão : %s  (%s)%n", caminhao.getPlaca(), caminhao.getMotorista());
        System.out.printf ("  Capacidade: %.0f kg%n", caminhao.getCapacidadeMaximaKg());
        System.out.println("──────────────────────────────────────────────────");

        if (pedidos.isEmpty()) {
            System.out.println("  (nenhum pedido alocado)");
        } else {
            pedidos.forEach(p -> System.out.printf(
                "  Pedido #%d | %-20s | %5.1f kg | R$ %6.2f%n",
                p.getNumeroPedido(), p.getCliente().getNome(),
                p.getPesoTotal(), p.getValorTotal()));
        }

        System.out.println("──────────────────────────────────────────────────");
        System.out.printf ("  Peso total    : %6.1f / %.0f kg  (disponível: %.1f kg)%n",
                calcularPesoTotal(), caminhao.getCapacidadeMaximaKg(), calcularCapacidadeDisponivel());
        System.out.printf ("  Valor total   : R$ %.2f%n", calcularValorTotal());
        System.out.printf ("  Total pedidos : %d%n", pedidos.size());
        System.out.println("╚══════════════════════════════════════════════════╝");
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    public Long          getNumeroRoteiro() { return numeroRoteiro; }
    public Caminhao      getCaminhao()      { return caminhao; }
    public LocalDate     getData()          { return data; }
    public List<Pedido>  getPedidos()       { return pedidos; }

    @Override
    public String toString() {
        return String.format("Roteiro #%d | %s | %s (%s) | %d pedidos | %.1f / %.0f kg",
                numeroRoteiro, data.format(FMT),
                caminhao.getPlaca(), caminhao.getMotorista(),
                pedidos.size(), calcularPesoTotal(), caminhao.getCapacidadeMaximaKg());
    }
}
