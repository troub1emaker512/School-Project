/*
  ==============================================================================

    MusicLibraryComponent.h
    Created: 6 Mar 2025 5:58:09pm
    Author:  Admin

  ==============================================================================
*/

#pragma once

#include "../JuceLibraryCode/JuceHeader.h"
#include "DeckGUI.h"

// Music Playlist headers
// Adds buttons for user interaction and calls to DeckGUI for loading uploaded tracks to the decks
class MusicLibraryComponent : public juce::Component,
    public juce::Button::Listener,
    public juce::ListBoxModel
{
public:
    // Call to DeckGUI
    MusicLibraryComponent(DeckGUI* deck1Gui, DeckGUI* deck2Gui);
    ~MusicLibraryComponent() override;

    // Paints and adds space to the gui for the playlist
    void paint(juce::Graphics& g) override;
    void resized() override;

    // Button listeners
    void buttonClicked(juce::Button* button) override;

    // ListBoxModel overrides
    int getNumRows() override;
    void paintListBoxItem(int rowNumber, juce::Graphics& g,
        int width, int height, bool rowIsSelected) override;

private:
    // References to deckGUI to load tracks
    DeckGUI* deck1 = nullptr;
    DeckGUI* deck2 = nullptr;

    // Buttons
    juce::TextButton uploadBtn{ "Upload Audio" };
    juce::TextButton clearBtn{ "Clear Library" };
    juce::TextButton deleteBtn{ "Delete Track" };
    juce::TextButton loadDeck1Btn{ "Load to Deck 1" };
    juce::TextButton loadDeck2Btn{ "Load to Deck 2" };

    // List of uploaded tracks
    juce::ListBox    trackListBox;
    juce::StringArray trackNames;
    juce::OwnedArray<juce::File> trackFiles;

    // JUCE file chooser
    juce::FileChooser fileChooser{ "Select an audio file..." };

    // Helper functions
    void uploadAudio();
    void clearLibrary();
    void deleteSelectedTrack();
    void loadToDeck(int deckNumber);

    // Playlist saving and loading
    void loadLibraryFromFile();
    void saveLibraryToFile(const juce::File& originalFile);
    juce::File getPlaylistFolder();

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(MusicLibraryComponent)
};
