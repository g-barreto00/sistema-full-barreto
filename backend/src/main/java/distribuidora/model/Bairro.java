package distribuidora.model;

import jakarta.persistence.*;

@Entity
@Table(name = "bairros")
public class Bairro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String nome;

    protected Bairro() {}

    public Bairro(String nome) { this.nome = nome; }

    public Long   getId()   { return id; }
    public String getNome() { return nome; }
}