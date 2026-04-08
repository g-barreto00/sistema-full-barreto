package distribuidora.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import distribuidora.enums.StatusPedido;
import distribuidora.enums.TipoCliente;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "clientes")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String      nome;

    @Enumerated(EnumType.STRING)
    private TipoCliente tipoCliente;

    private String      documento;
    private String      razaoSocial;
    private String      endereco;
    private String      bairro;
    private String      pontoReferencia;
    private String      telefone;
    private boolean     ativo;

    @JsonIgnore
    @OneToMany(mappedBy = "cliente", fetch = FetchType.LAZY)
    private List<Pedido> pedidos = new ArrayList<>();

    // ── Construtores ──────────────────────────────────────────────────────────

    protected Cliente() {}

    public Cliente(String nome, String documento,
                   String endereco, String bairro, String telefone) {
        this.nome        = nome;
        this.tipoCliente = TipoCliente.CPF;
        this.documento   = documento;
        this.endereco    = endereco;
        this.bairro      = bairro;
        this.telefone    = telefone;
        this.ativo       = true;
    }

    public Cliente(String nome, String documento, String razaoSocial,
                   String endereco, String bairro, String telefone) {
        this(nome, documento, endereco, bairro, telefone);
        this.tipoCliente = TipoCliente.CNPJ;
        this.razaoSocial = razaoSocial;
    }

    // ── Pedidos ───────────────────────────────────────────────────────────────

    public void adicionarPedido(Pedido p) { pedidos.add(p); }

    // ── Financeiro ────────────────────────────────────────────────────────────

    public double totalGasto() {
        return pedidos.stream()
                .filter(p -> p.getStatus() == StatusPedido.ENTREGUE)
                .mapToDouble(Pedido::getValorTotal)
                .sum();
    }

    // ── Busca ─────────────────────────────────────────────────────────────────

    private static String normalizar(String s) {
        return s == null ? "" : s.replaceAll("[.\\-/()\\s]", "").toLowerCase();
    }

    public boolean buscarPor(String termo) {
        String t = normalizar(termo);
        return normalizar(nome).contains(t)
            || normalizar(documento).contains(t)
            || normalizar(telefone).contains(t)
            || normalizar(bairro).contains(t)
            || normalizar(razaoSocial).contains(t);
    }

    // ── Exclusão lógica ───────────────────────────────────────────────────────

    public void desativar() { this.ativo = false; }
    public void reativar()  { this.ativo = true; }

    // ── Exibir ────────────────────────────────────────────────────────────────

    public void exibirDados() {
        System.out.println("══════════════════════════════════════════");
        System.out.println("  Nome     : " + nome + (ativo ? "" : " [INATIVO]"));
        System.out.println("  Tipo     : " + tipoCliente.getDescricao());
        System.out.println("  Doc.     : " + documento);
        if (tipoCliente == TipoCliente.CNPJ)
            System.out.println("  Razão    : " + razaoSocial);
        System.out.println("  Endereço : " + endereco + " — " + bairro);
        if (pontoReferencia != null && !pontoReferencia.isBlank())
            System.out.println("  Ref.     : " + pontoReferencia);
        System.out.println("  Telefone : " + telefone);
        System.out.printf ("  Pedidos  : %d  |  Total gasto: R$ %.2f%n", pedidos.size(), totalGasto());
        System.out.println("══════════════════════════════════════════");
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public Long        getId()                { return id; }
    public String      getNome()              { return nome; }
    public void        setNome(String v)      { this.nome = v; }
    public TipoCliente getTipoCliente()       { return tipoCliente; }
    public String      getDocumento()         { return documento; }
    public void        setDocumento(String v) { this.documento = v; }
    public String      getRazaoSocial()       { return razaoSocial; }
    public void        setRazaoSocial(String v) { if (tipoCliente == TipoCliente.CNPJ) this.razaoSocial = v; }
    public String      getEndereco()          { return endereco; }
    public void        setEndereco(String v)  { this.endereco = v; }
    public String      getBairro()            { return bairro; }
    public void        setBairro(String v)    { this.bairro = v; }
    public String      getPontoReferencia()   { return pontoReferencia; }
    public void        setPontoReferencia(String v) { this.pontoReferencia = v; }
    public String      getTelefone()          { return telefone; }
    public void        setTelefone(String v)  { this.telefone = v; }
    public boolean     isAtivo()              { return ativo; }
    public List<Pedido> getPedidos()          { return pedidos; }

    @Override
    public String toString() {
        return String.format("[%s] %s | %s | %s%s",
                tipoCliente, nome, documento, telefone, ativo ? "" : " [INATIVO]");
    }
}
