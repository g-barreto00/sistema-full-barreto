package distribuidora.repository;

import distribuidora.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    List<Cliente> findByAtivoTrue();
    List<Cliente> findByBairroIgnoreCase(String bairro);
}
