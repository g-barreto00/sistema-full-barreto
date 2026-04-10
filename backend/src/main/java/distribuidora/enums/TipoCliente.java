package distribuidora.enums;

public enum TipoCliente {
    CPF("Pessoa Física"),
    CNPJ("Pessoa Jurídica");

    private final String descricao;
    TipoCliente(String descricao) { this.descricao = descricao; }
    public String getDescricao()  { return descricao; }
}
