package distribuidora.repository;

import distribuidora.model.Bairro;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BairroRepository extends JpaRepository<Bairro, Long> {
    boolean existsByNomeIgnoreCase(String nome);
}