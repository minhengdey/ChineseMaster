package com.bucha.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "audio_assets")
public class AudioAsset {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String filename;
    private String description;

    public AudioAsset() {}

}
