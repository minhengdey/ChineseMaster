package com.bucha.repository;

import com.bucha.entity.ChineseCharacter;
import java.util.List;

public interface ChineseCharacterRepository {
    List<ChineseCharacter> findAll();

    ChineseCharacter findById(String id);
}
