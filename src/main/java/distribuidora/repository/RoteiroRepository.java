package distribuidora.repository;

import distribuidora.model.Caminhao;
import distribuidora.model.Roteiro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface RoteiroRepository extends JpaRepository<Roteiro, Long> {
    List<Roteiro> findByData(LocalDate data);
    List<Roteiro> findByCaminhao(Caminhao caminhao);
}
