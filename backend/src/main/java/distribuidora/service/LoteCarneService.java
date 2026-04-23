package distribuidora.service;

import distribuidora.model.Cliente;
import distribuidora.model.LoteCarne;
import distribuidora.repository.LoteCarneRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class LoteCarneService {

    private final LoteCarneRepository loteCarneRepository;

    public LoteCarneService(LoteCarneRepository loteCarneRepository) {
        this.loteCarneRepository = loteCarneRepository;
    }

    @Transactional
    public LoteCarne criar(Cliente cliente, int quantidade, LocalDate dataCompra, String observacao) {
        return loteCarneRepository.save(new LoteCarne(cliente, quantidade, dataCompra, observacao));
    }

    @Transactional(readOnly = true)
    public List<LoteCarne> listarPorCliente(Long clienteId) {
        return loteCarneRepository.findByClienteId(clienteId);
    }

    @Transactional(readOnly = true)
    public int saldoTotal(Long clienteId) {
        return listarPorCliente(clienteId).stream()
                .mapToInt(LoteCarne::getQuantidadeRestante)
                .sum();
    }

    @Transactional
    public void usarCarnes(Long clienteId, int quantidade) {
        List<LoteCarne> lotes = loteCarneRepository.findByClienteId(clienteId)
                .stream()
                .filter(l -> l.getQuantidadeRestante() > 0)
                .toList();

        int saldo = lotes.stream().mapToInt(LoteCarne::getQuantidadeRestante).sum();
        if (saldo < quantidade)
            throw new IllegalStateException(
                "Cliente não tem carnês suficientes. Saldo: " + saldo + ", necessário: " + quantidade);

        int restante = quantidade;
        for (LoteCarne lote : lotes) {
            if (restante <= 0) break;
            int usar = Math.min(restante, lote.getQuantidadeRestante());
            lote.usar(usar);
            loteCarneRepository.save(lote);
            restante -= usar;
        }
    }

    @Transactional(readOnly = true)
    public Optional<LoteCarne> buscarPorId(Long id) {
        return loteCarneRepository.findById(id);
    }
}