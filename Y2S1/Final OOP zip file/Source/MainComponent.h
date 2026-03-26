/*
  ==============================================================================

    This file was auto-generated!

  ==============================================================================
*/

#pragma once

#include "../JuceLibraryCode/JuceHeader.h"
#include "DJAudioPlayer.h"
#include "DeckGUI.h"
#include "MusicLibraryComponent.h"

class MainComponent : public juce::AudioAppComponent
{
public:
    MainComponent();
    ~MainComponent() override;

    // AudioAppComponent
    void prepareToPlay(int samplesPerBlockExpected, double sampleRate) override;
    void getNextAudioBlock(const juce::AudioSourceChannelInfo& bufferToFill) override;
    void releaseResources() override;

    // UI
    void paint(juce::Graphics& g) override;
    void resized() override;

private:
    juce::AudioFormatManager formatManager;
    juce::AudioThumbnailCache thumbCache{ 100 };

    DJAudioPlayer player1{ formatManager };
    DeckGUI deckGUI1{ true,  &player1, formatManager, thumbCache };

    DJAudioPlayer player2{ formatManager };
    DeckGUI deckGUI2{ false, &player2, formatManager, thumbCache };

    juce::MixerAudioSource mixerSource;

    // New library/playlist component
    MusicLibraryComponent musicLibrary{ &deckGUI1, &deckGUI2 };

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(MainComponent)
};

