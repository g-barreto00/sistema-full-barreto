package distribuidora.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "lotes_carne")
public class LoteCarne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    private int       quantidadeTotal;
    private int       quantidadeUsada;
    private LocalDate dataCompra;
    private String    observacao;

    protected LoteCarne() {}

    public LoteCarne(Cliente cliente, int quantidadeTotal, LocalDate dataCompra, String observacao) {
        this.cliente         = cliente;
        this.quantidadeTotal = quantidadeTotal;
        this.quantidadeUsada = 0;
        this.dataCompra      = dataCompra;
        this.observacao      = observacao;
    }

    public void usar(int quantidade) {
        if (quantidade > getQuantidadeRestante())
            throw new IllegalStateException("Carnês insuficientes neste lote.");
        this.quantidadeUsada += quantidade;
    }

    public Long      getId()                { return id; }
    public Cliente   getCliente()           { return cliente; }
    public int       getQuantidadeTotal()   { return quantidadeTotal; }
    public int       getQuantidadeUsada()   { return quantidadeUsada; }
    public int       getQuantidadeRestante(){ return quantidadeTotal - quantidadeUsada; }
    public LocalDate getDataCompra()        { return dataCompra; }
    public String    getObservacao()        { return observacao; }
}