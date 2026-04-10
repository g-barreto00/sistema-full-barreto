package distribuidora.service;

import distribuidora.enums.Produto;
import distribuidora.enums.StatusPedido;
import distribuidora.model.Cliente;
import distribuidora.model.Pedido;
import distribuidora.repository.PedidoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RelatorioService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final PedidoRepository pedidoRepository;

    public RelatorioService(PedidoRepository pedidoRepository) {
        this.pedidoRepository = pedidoRepository;
    }

    // ── Filtros por período ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Pedido> filtrarPorPeriodo(LocalDate inicio, LocalDate fim) {
        return pedidoRepository.findByDataPedidoBetween(inicio, fim);
    }

    @Transactional(readOnly = true)
    public List<Pedido> pedidosDoDia() {
        LocalDate h = LocalDate.now(); return filtrarPorPeriodo(h, h);
    }

    @Transactional(readOnly = true)
    public List<Pedido> pedidosDaSemana() {
        LocalDate h = LocalDate.now();
        return filtrarPorPeriodo(h.with(DayOfWeek.MONDAY), h.with(DayOfWeek.SUNDAY));
    }

    @Transactional(readOnly = true)
    public List<Pedido> pedidosDoMes() {
        LocalDate h = LocalDate.now();
        return filtrarPorPeriodo(h.withDayOfMonth(1), h.withDayOfMonth(h.lengthOfMonth()));
    }

    @Transactional(readOnly = true)
    public List<Pedido> pedidosDoAno() {
        LocalDate h = LocalDate.now();
        return filtrarPorPeriodo(h.withDayOfYear(1), h.withDayOfYear(h.lengthOfYear()));
    }

    // ── Relatório por bairro ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public void relatorioPorBairro(LocalDate inicio, LocalDate fim) {
        var entregues = filtrarPorPeriodo(inicio, fim).stream()
                .filter(p -> p.getStatus() == StatusPedido.ENTREGUE).toList();

        if (entregues.isEmpty()) { System.out.println("Sem pedidos entregues no período."); return; }

        Map<String, Double> porBairro = new TreeMap<>();
        entregues.forEach(p -> porBairro.merge(p.getCliente().getBairro(), p.getValorTotal(), Double::sum));
        double total = porBairro.values().stream().mapToDouble(Double::doubleValue).sum();

        System.out.println("══════════════════════════════════════════════");
        System.out.println("  RELATÓRIO POR BAIRRO");
        System.out.printf ("  Período: %s até %s%n", inicio.format(FMT), fim.format(FMT));
        System.out.println("──────────────────────────────────────────────");
        porBairro.forEach((b, v) -> System.out.printf("  %-25s  R$ %8.2f%n", b, v));
        System.out.println("──────────────────────────────────────────────");
        System.out.printf ("  Total geral:               R$ %8.2f%n", total);
        System.out.println("══════════════════════════════════════════════");
    }

    // ── Rankings ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public void produtosMaisVendidos(LocalDate inicio, LocalDate fim) {
        Map<Produto, Integer> cont = new EnumMap<>(Produto.class);
        filtrarPorPeriodo(inicio, fim).stream()
                .filter(p -> p.getStatus() != StatusPedido.CANCELADO)
                .flatMap(p -> p.getItens().stream())
                .forEach(i -> cont.merge(i.getProduto(), i.getQuantidade(), Integer::sum));

        System.out.println("── PRODUTOS MAIS VENDIDOS ──────────────────────");
        cont.entrySet().stream()
                .sorted(Map.Entry.<Produto, Integer>comparingByValue().reversed())
                .forEach(e -> System.out.printf("  [%s] %-30s %4d un.%n",
                        e.getKey().getCodigoProduto(), e.getKey().getNome(), e.getValue()));
        System.out.println("────────────────────────────────────────────────");
    }

    @Transactional(readOnly = true)
    public void bairrosComMaisPedidos(LocalDate inicio, LocalDate fim) {
        Map<String, Long> cont = filtrarPorPeriodo(inicio, fim).stream()
                .filter(p -> p.getStatus() != StatusPedido.CANCELADO)
                .collect(Collectors.groupingBy(p -> p.getCliente().getBairro(), Collectors.counting()));

        System.out.println("── BAIRROS COM MAIS PEDIDOS ────────────────────");
        cont.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .forEach(e -> System.out.printf("  %-25s %4d pedidos%n", e.getKey(), e.getValue()));
        System.out.println("────────────────────────────────────────────────");
    }

    // ── Por cliente ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public void listarPedidosPorCliente(Cliente cliente) {
        var lista = pedidoRepository.findByCliente(cliente);
        System.out.println("Pedidos de " + cliente.getNome() + ":");
        if (lista.isEmpty()) { System.out.println("  (nenhum)"); return; }
        lista.forEach(System.out::println);
        System.out.printf("Total gasto (entregues): R$ %.2f%n", cliente.totalGasto());
    }

    // ── Utilitário ────────────────────────────────────────────────────────────

    public void exibirListagem(String titulo, List<Pedido> pedidos) {
        System.out.println("── " + titulo + " ──────────────────────────────────");
        if (pedidos.isEmpty()) { System.out.println("  (nenhum pedido)"); }
        else {
            pedidos.forEach(System.out::println);
            double total = pedidos.stream().filter(p -> p.getStatus() == StatusPedido.ENTREGUE)
                    .mapToDouble(Pedido::getValorTotal).sum();
            System.out.printf("  Total entregues: R$ %.2f%n", total);
        }
        System.out.println("────────────────────────────────────────────────");
    }
}
