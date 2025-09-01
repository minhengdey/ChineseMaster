package com.bucha.entity;

public class ChineseCharacter {
    private String id;
    private String character;
    private String pinyin;
    private String audioUrl;

    public ChineseCharacter() {
    }

    public ChineseCharacter(String id, String character, String pinyin, String audioUrl) {
        this.id = id;
        this.character = character;
        this.pinyin = pinyin;
        this.audioUrl = audioUrl;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCharacter() {
        return character;
    }

    public void setCharacter(String character) {
        this.character = character;
    }

    public String getPinyin() {
        return pinyin;
    }

    public void setPinyin(String pinyin) {
        this.pinyin = pinyin;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public void setAudioUrl(String audioUrl) {
        this.audioUrl = audioUrl;
    }
}
