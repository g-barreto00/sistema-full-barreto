package distribuidora.enums;

public enum Produto {

    //                           codigo    nome                           preco   pesoKg  marca            unid
    BABY_200ML(         "001", "Baby 200ml",                      8.90,   2.4,  "Dias d'Ávila",    12),
    COPO_200ML(         "002", "200ml Copo",                     37.60,   2.4,  "Milfontes",       48),
    COPO_300ML(         "003", "300ml Copo",                     41.40,   3.6,  "Milfontes",       48),
    SEM_GAS_330ML(      "004", "330ml sem Gás",                  13.60,   4.0,  "Dias d'Ávila",    12),
    COM_GAS_330ML(      "005", "330ml com Gás",                  16.70,   4.0,  "Dias d'Ávila",    12),
    SEM_GAS_500ML(      "006", "500ml sem Gás",                  13.60,   6.0,  "Dias d'Ávila",    12),
    COM_GAS_500ML(      "007", "500ml com Gás",                  19.30,   6.0,  "Dias d'Ávila",    12),
    ML_1500(            "008", "1.500ml",                        13.60,   1.5,  "Dias d'Ávila",    12),
    LITROS_5(           "009", "5 Litros",                       10.50,   5.0,  "Dias d'Ávila",     1),
    GARRAFAO_REPOSICAO( "010", "Garrafão 20L Reposição",         14.00,  20.0,  "Dias d'Ávila",     1),
    GARRAFAO_COMPLETO(  "011", "Garrafão 20L Completo",          47.00,  20.0,  "Dias d'Ávila",     1),
    GARRAFAO_VAZIO(     "012", "Garrafão 20L Vazio",             35.00,  20.0,  "Dias d'Ávila",     1);

    private final String codigoProduto;
    private final String nome;
    private final double preco;
    private final double pesoEmKg;
    private final String marca;
    private final int    unidadesPorEmbalagem;

    Produto(String codigoProduto, String nome, double preco, double pesoEmKg,
            String marca, int unidadesPorEmbalagem) {
        this.codigoProduto        = codigoProduto;
        this.nome                 = nome;
        this.preco                = preco;
        this.pesoEmKg             = pesoEmKg;
        this.marca                = marca;
        this.unidadesPorEmbalagem = unidadesPorEmbalagem;
    }

    public String getCodigoProduto()       { return codigoProduto; }
    public String getNome()                { return nome; }
    public double getPreco()               { return preco; }
    public double getPesoEmKg()            { return pesoEmKg; }
    public String getMarca()               { return marca; }
    public int    getUnidadesPorEmbalagem(){ return unidadesPorEmbalagem; }

    @Override
    public String toString() {
        return String.format("[%s] %-30s R$ %5.2f  %.1f kg  %s  %dx",
                codigoProduto, nome, preco, pesoEmKg, marca, unidadesPorEmbalagem);
    }
}