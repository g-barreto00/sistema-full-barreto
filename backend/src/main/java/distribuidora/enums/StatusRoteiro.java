package distribuidora.enums;

public enum StatusRoteiro {
    EM_ANDAMENTO("Em andamento"),
    FINALIZADO("Finalizado");

    private final String descricao;
    StatusRoteiro(String descricao) { this.descricao = descricao; }
    public String getDescricao() { return descricao; }
}