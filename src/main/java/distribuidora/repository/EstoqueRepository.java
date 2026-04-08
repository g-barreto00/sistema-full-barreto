package distribuidora.repository;

import distribuidora.enums.Produto;
import distribuidora.model.Estoque;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EstoqueRepository extends JpaRepository<Estoque, Produto> {
}
