package distribuidora.repository;

import distribuidora.model.LoteCarne;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoteCarneRepository extends JpaRepository<LoteCarne, Long> {
    List<LoteCarne> findByClienteId(Long clienteId);
}