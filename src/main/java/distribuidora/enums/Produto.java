package distribuidora.enums;

public enum Produto {

    //                        codigo      nome                          preco   pesoKg
    GARRAFAO_COMPLETO(  "GAR-C",  "Garrafão 20L (completo)",     25.00,  21.0),
    GARRAFAO_REPOSICAO( "GAR-R",  "Garrafão 20L (reposição)",     8.00,  20.0),
    PACOTE_BABY(        "PAC-B",  "Pacote Baby 300ml",            12.50,   3.6),
    PACOTE_COPINHO(     "PAC-CO", "Pacote Copinho 200ml",         10.00,   4.8),
    PACOTE_500ML_COM_GAS("PAC-CG","Pacote 500ml c/ Gás",         15.00,   6.0),
    PACOTE_500ML_SEM_GAS("PAC-SG","Pacote 500ml s/ Gás",         13.00,   6.0);

    private final String codigoProduto;
    private final String nome;
    private final double preco;
    private final double pesoEmKg;

    Produto(String codigoProduto, String nome, double preco, double pesoEmKg) {
        this.codigoProduto = codigoProduto;
        this.nome          = nome;
        this.preco         = preco;
        this.pesoEmKg      = pesoEmKg;
    }

    public String getCodigoProduto() { return codigoProduto; }
    public String getNome()          { return nome; }
    public double getPreco()         { return preco; }
    public double getPesoEmKg()      { return pesoEmKg; }

    @Override
    public String toString() {
        return String.format("[%s] %-28s R$ %5.2f  %.1f kg",
                codigoProduto, nome, preco, pesoEmKg);
    }
}
