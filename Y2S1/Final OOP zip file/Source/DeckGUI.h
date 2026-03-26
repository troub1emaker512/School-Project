/*
  ==============================================================================

    DeckGUI.h
    Created: 13 Mar 2020 6:44:48pm
    Author:  matthew

  ==============================================================================
*/

#pragma once

#include "../JuceLibraryCode/JuceHeader.h"
#include "DJAudioPlayer.h"
#include "WaveformDisplay.h"

class DeckGUI : public Component,
    public Button::Listener,
    public Slider::Listener,
    public FileDragAndDropTarget,
    public Timer
{
public:
    /**
     * Constructor
     * @param isDeck1 whether this is the "left" deck (deck1) or the "right" deck (deck2),
     *                used for any deck-specific logic you like.
     * @param _player pointer to the DJAudioPlayer that handles audio playback.
     * @param formatManagerToUse shared AudioFormatManager.
     * @param cacheToUse shared AudioThumbnailCache.
     */
    DeckGUI(bool isDeck1,
        DJAudioPlayer* _player,
        AudioFormatManager& formatManagerToUse,
        AudioThumbnailCache& cacheToUse);

    ~DeckGUI() override;

    void paint(Graphics&) override;
    void resized() override;

    // Button listener
    void buttonClicked(Button* button) override;

    // Slider listener
    void sliderValueChanged(Slider* slider) override;

    // Override to detect when user interacts with the position slider
    void sliderDragStarted(juce::Slider* slider) override;
    void sliderDragEnded(juce::Slider* slider) override;

    // FileDragAndDropTarget
    bool isInterestedInFileDrag(const StringArray& files) override;
    void filesDropped(const StringArray& files, int x, int y) override;

    // Timer
    void timerCallback() override;

    // External call for loading files onto deck
    void loadFileIntoDeck(const File& file);

private:
    // True if this is the left deck, false if it is the right deck
    bool deckIsOnLeftSide = false;

    // Tells the program whether the deck is currently playing or not
    bool isPlaying = false;

    // Manual track scrubbing
    bool isUserChangingPosSlider = false;  

    // File chooser
    FileChooser fChooser{ "Select a file..." };

    // Toggle for PLAY/STOP
    TextButton playPauseButton{ "Play" };

    // Sliders
    Slider volSlider;
    Slider speedSlider;
    Slider posSlider;

    // Loop checkbox
    ToggleButton loopToggle{ "Loop" };

    // Labels for each slider
    Label volumeLabel{ "volumeLabel", "Volume" };
    Label speedLabel{ "speedLabel",  "Speed" };
    Label trackPosLabel{ "trackPosLabel", "Track Position" };

    // Waveform display
    WaveformDisplay waveformDisplay;

    // Audio player
    DJAudioPlayer* player{ nullptr };

    // Values for animated CD
    // Speed multiplier for animation
    float cdSpinSpeed = 0.05f;

    float rotationAngle = 0.0f;
    Rectangle<int> rotatingCDRect;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(DeckGUI)
};
