package com.bucha.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "audio_assets")
public class AudioAsset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename; // tên file hoặc identifier

    @Column
    private String description;

    @Column(nullable = false)
    private String audioPath; // đường dẫn file hoặc URL

    @Enumerated(EnumType.STRING)
    private AudioType audioType = AudioType.LOCAL_FILE; // LOCAL_FILE hoặc EXTERNAL_URL

    @Column
    private String mimeType = "audio/mpeg"; // loại file audio

    @Column
    private Long duration; // độ dài audio (seconds)

    // Constructors
    public AudioAsset() {
    }

    public AudioAsset(String filename, String audioPath) {
        this.filename = filename;
        this.audioPath = audioPath;
        this.audioType = AudioType.LOCAL_FILE;
    }

    public AudioAsset(String filename, String audioPath, AudioType audioType) {
        this.filename = filename;
        this.audioPath = audioPath;
        this.audioType = audioType;
    }
}
