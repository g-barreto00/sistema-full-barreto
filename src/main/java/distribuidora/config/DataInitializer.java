package distribuidora.config;

import distribuidora.enums.Produto;
import distribuidora.enums.StatusPedido;
import distribuidora.model.*;
import distribuidora.service.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final EstoqueService estoqueService;
    private final ClienteService clienteService;
    private final PedidoService  pedidoService;
    private final RoteiroService roteiroService;

    public DataInitializer(EstoqueService estoqueService,
                           ClienteService clienteService,
                           PedidoService pedidoService,
                           RoteiroService roteiroService) {
        this.estoqueService = estoqueService;
        this.clienteService = clienteService;
        this.pedidoService  = pedidoService;
        this.roteiroService = roteiroService;
    }

    @Override
    public void run(String... args) {
        // ── Estoque inicial ───────────────────────────────────────────────────
        estoqueService.inicializar(Produto.GARRAFAO_COMPLETO,    10);
        estoqueService.inicializar(Produto.GARRAFAO_REPOSICAO,   50);
        estoqueService.inicializar(Produto.PACOTE_BABY,          30);
        estoqueService.inicializar(Produto.PACOTE_COPINHO,       40);
        estoqueService.inicializar(Produto.PACOTE_500ML_COM_GAS, 25);
        estoqueService.inicializar(Produto.PACOTE_500ML_SEM_GAS, 25);

        // ── Clientes de teste ─────────────────────────────────────────────────
        Cliente c1 = clienteService.cadastrar(
                new Cliente("Maria Silva", "123.456.789-00", "Rua A, 10", "Pituba", "71 9 9000-0001"));
        Cliente c2 = clienteService.cadastrar(
                new Cliente("João Santos", "987.654.321-00", "Rua B, 20", "Itapuã", "71 9 9000-0002"));
        Cliente c3 = clienteService.cadastrar(
                new Cliente("Ana Lima", "111.222.333-00", "Rua C, 30", "Amaralina", "71 9 9000-0003"));
        Cliente c4 = clienteService.cadastrar(
                new Cliente("Água Pura Ltda", "12.345.678/0001-90", "Água Pura SA",
                            "Av. D, 100", "Pituba", "71 9 9000-0004"));

        // ── Pedidos de teste ──────────────────────────────────────────────────
        Pedido p1 = pedidoService.emitirPedido(c1, List.of(
                new ItemPedido(Produto.GARRAFAO_REPOSICAO, 3),
                new ItemPedido(Produto.PACOTE_COPINHO, 2)));
        if (p1 != null) pedidoService.alterarStatus(p1, StatusPedido.ENTREGUE);

        Pedido p2 = pedidoService.emitirPedido(c2, List.of(
                new ItemPedido(Produto.GARRAFAO_COMPLETO, 1)));
        if (p2 != null) pedidoService.alterarStatus(p2, StatusPedido.ENTREGUE);

        pedidoService.emitirPedido(c3, List.of(
                new ItemPedido(Produto.PACOTE_500ML_SEM_GAS, 4)));

        Pedido p4 = pedidoService.emitirPedido(c4, List.of(
                new ItemPedido(Produto.GARRAFAO_REPOSICAO, 10)));
        if (p4 != null) pedidoService.alterarStatus(p4, StatusPedido.ENTREGUE);

        // ── Caminhão e roteiro de exemplo ─────────────────────────────────────
        Caminhao cam = roteiroService.cadastrarCaminhao(
                new Caminhao("BRA-2E19", "Carlos Souza", 1000.0));
        Roteiro roteiro = roteiroService.criarRoteiro(cam, LocalDate.now());
        if (p1 != null) roteiroService.adicionarPedido(roteiro, p1);
        if (p2 != null) roteiroService.adicionarPedido(roteiro, p2);

        System.out.println("(dados de teste carregados)\n");
    }
}
