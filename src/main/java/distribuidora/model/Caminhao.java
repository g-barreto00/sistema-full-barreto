package distribuidora.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "caminhoes")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Caminhao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String placa;
    private String motorista;
    private double capacidadeMaximaKg;

    protected Caminhao() {}

    public Caminhao(String placa, String motorista, double capacidadeMaximaKg) {
        this.placa              = placa;
        this.motorista          = motorista;
        this.capacidadeMaximaKg = capacidadeMaximaKg;
    }

    public Long   getId()                         { return id; }
    public String getPlaca()                      { return placa; }
    public void   setPlaca(String v)              { this.placa = v; }
    public String getMotorista()                  { return motorista; }
    public void   setMotorista(String v)          { this.motorista = v; }
    public double getCapacidadeMaximaKg()         { return capacidadeMaximaKg; }
    public void   setCapacidadeMaximaKg(double v) { this.capacidadeMaximaKg = v; }

    @Override
    public String toString() {
        return String.format("%-10s | Motorista: %-20s | Capacidade: %.0f kg",
                placa, motorista, capacidadeMaximaKg);
    }
}
