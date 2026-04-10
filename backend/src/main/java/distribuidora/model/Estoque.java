package distribuidora.model;

import distribuidora.enums.Produto;
import jakarta.persistence.*;

@Entity
@Table(name = "estoque")
public class Estoque {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Produto produto;

    private int quantidade;

    protected Estoque() {}

    public Estoque(Produto produto, int quantidade) {
        this.produto    = produto;
        this.quantidade = quantidade;
    }

    public Produto getProduto()              { return produto; }
    public int     getQuantidade()           { return quantidade; }
    public void    setQuantidade(int v)      { this.quantidade = v; }
}
