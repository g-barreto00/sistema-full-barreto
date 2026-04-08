package distribuidora.repository;

import distribuidora.model.Cliente;
import distribuidora.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByCliente(Cliente cliente);
    List<Pedido> findByDataPedidoBetween(LocalDate inicio, LocalDate fim);
}
