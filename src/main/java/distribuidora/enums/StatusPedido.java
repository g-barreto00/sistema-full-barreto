package distribuidora.enums;

public enum StatusPedido {
    PENDENTE("Pendente"),
    ENTREGUE("Entregue"),
    CANCELADO("Cancelado");

    private final String descricao;
    StatusPedido(String descricao) { this.descricao = descricao; }
    public String getDescricao()   { return descricao; }
}
