package com.bucha.service;

import com.bucha.entity.ChineseCharacter;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ChineseAlphabetService implements com.bucha.repository.ChineseCharacterRepository {
    private final List<ChineseCharacter> characters;

    public ChineseAlphabetService() {
        ObjectMapper mapper = new ObjectMapper();
        try (InputStream is = getClass().getResourceAsStream("/data/chinese_alphabet.json")) {
            characters = mapper.readValue(is, new TypeReference<List<ChineseCharacter>>() {
            });
        } catch (Exception e) {
            throw new RuntimeException("Cannot load Chinese alphabet data", e);
        }
    }

    @Override
    public List<ChineseCharacter> findAll() {
        return characters;
    }

    @Override
    public ChineseCharacter findById(String id) {
        Optional<ChineseCharacter> result = characters.stream().filter(c -> c.getId().equals(id)).findFirst();
        return result.orElse(null);
    }

    public org.springframework.core.io.Resource getAudioResource(String id) {
        ChineseCharacter character = findById(id);
        if (character == null)
            return null;
        return new org.springframework.core.io.ClassPathResource(
                "uploads/" + character.getAudioUrl().substring("/uploads/".length()));
    }
}
