/*
  ==============================================================================

    DeckGUI.cpp
    Created: 13 Mar 2020 6:44:48pm
    Author:  matthew

  ==============================================================================
*/

#include "../JuceLibraryCode/JuceHeader.h"
#include "DeckGUI.h"

//==============================================================================
DeckGUI::DeckGUI(bool isDeck1,
    DJAudioPlayer* _player,
    AudioFormatManager& formatManagerToUse,
    AudioThumbnailCache& cacheToUse)
    : deckIsOnLeftSide(isDeck1),
    player(_player),
    waveformDisplay(formatManagerToUse, cacheToUse)
{
    addAndMakeVisible(playPauseButton);
    addAndMakeVisible(volSlider);
    addAndMakeVisible(speedSlider);
    addAndMakeVisible(posSlider);
    addAndMakeVisible(loopToggle);
    addAndMakeVisible(waveformDisplay);
    addAndMakeVisible(trackPosLabel);
    addAndMakeVisible(volumeLabel);
    addAndMakeVisible(speedLabel);

    playPauseButton.addListener(this);
    volSlider.addListener(this);
    speedSlider.addListener(this);
    posSlider.addListener(this);
    loopToggle.addListener(this);

    // Sliders
    //Volume slider
    volSlider.setRange(0.0, 1.0);
    // Default volume at half
    volSlider.setValue(0.5); 
    volSlider.setNumDecimalPlacesToDisplay(2);

    // Track playback speed (default already at 1)
    speedSlider.setRange(0.5, 2.0, 0.01);
    speedSlider.setValue(1.0); 

    // Track position slider
    posSlider.setRange(0.0, 1.0);
    posSlider.setNumDecimalPlacesToDisplay(2);

    // JUCE slider styles
    // Volume and speed are vertical
    volSlider.setSliderStyle(Slider::LinearVertical);
    speedSlider.setSliderStyle(Slider::LinearVertical);
    // Position slider is vertical
    posSlider.setSliderStyle(Slider::LinearHorizontal);

    // Labels for the sliders
    volSlider.setTextBoxStyle(Slider::TextBoxBelow, false, 50, 20);
    speedSlider.setTextBoxStyle(Slider::TextBoxBelow, false, 50, 20);
    posSlider.setTextBoxStyle(Slider::TextBoxBelow, false, 80, 20);

    volumeLabel.setFont(Font(14.0f, Font::bold));
    volumeLabel.setColour(Label::textColourId, Colours::white);
    volumeLabel.setJustificationType(Justification::centred);

    speedLabel.setFont(Font(14.0f, Font::bold));
    speedLabel.setColour(Label::textColourId, Colours::white);
    speedLabel.setJustificationType(Justification::centred);

    // Ensure labels do not block clicks to the loop checkbox
    volumeLabel.setInterceptsMouseClicks(false, false);
    speedLabel.setInterceptsMouseClicks(false, false);

    // Timer refresh
    startTimer(60);
}

DeckGUI::~DeckGUI()
{
    stopTimer();
}

void DeckGUI::paint(Graphics& g)
{
    // Black background
    g.fillAll(Colour::fromRGB(20, 20, 20));

    // Grey outline
    g.setColour(Colours::grey.withAlpha(0.3f)); 
    g.drawRect(getLocalBounds(), 1);

    // Title
    g.setColour(Colours::white);
    g.setFont(14.0f);
    g.drawText("DJ Application", 10, 10, 100, 20, Justification::left);

    // Actively repaint the sliders 
    volSlider.repaint();
    speedSlider.repaint();
    posSlider.repaint();

    // CD animation
    g.saveState();

    // Size of the CD graphic
    float cdSize = rotatingCDRect.getWidth() * 0.5f * 0.95f;
    float centerX = rotatingCDRect.getCentreX();
    float centerY = rotatingCDRect.getCentreY();

    // Apply rotation around center of the graphic
    g.addTransform(AffineTransform::rotation(rotationAngle, centerX, centerY));

    // Draw the outer CD
    ColourGradient gradient(Colours::darkcyan, centerX, centerY,
        Colours::darkblue, centerX + cdSize / 2, centerY, true);
    g.setGradientFill(gradient);
    g.fillEllipse(centerX - cdSize / 2, centerY - cdSize / 2, cdSize, cdSize);

    // Draw the smaller center circle
    g.setColour(Colours::white);
    float innerCircleSize = cdSize * 0.2f;
    g.fillEllipse(centerX - innerCircleSize / 2, centerY - innerCircleSize / 2, innerCircleSize, innerCircleSize);

    // Add lines to show when the CD spins
    g.setColour(Colours::lightgrey);
    // Number of lines
    int numLines = 12; 
    for (int i = 0; i < numLines; ++i)
    {
        float angle = MathConstants<float>::twoPi * ((float)i / (float)numLines);
        float startX = centerX + (cdSize * 0.3f) * std::cos(angle);
        float startY = centerY + (cdSize * 0.3f) * std::sin(angle);
        float endX = centerX + (cdSize * 0.45f) * std::cos(angle);
        float endY = centerY + (cdSize * 0.45f) * std::sin(angle);
        g.drawLine(startX, startY, endX, endY, 2.0f);
    }

    // Extra graphics for the CD
    g.setColour(Colours::black.withAlpha(0.3f));
    // Each 4 sections of the CD has a extra dark effect around the circumference, small fun effect i wanted to try
    for (int i = 0; i < 4; ++i) 
    {
        float angleStart = MathConstants<float>::twoPi * (i / 4.0f);
        float angleEnd = angleStart + MathConstants<float>::pi / 4.0f;
        Path trackSegment;
        trackSegment.addPieSegment(Rectangle<float>(centerX - cdSize / 2, centerY - cdSize / 2, cdSize, cdSize),
            angleStart, angleEnd, 0.85f);
        g.fillPath(trackSegment);
    }

    g.restoreState();
}

void DeckGUI::resized()
{
    auto area = getLocalBounds();
    // DJ app title bar
    area.removeFromTop(30);

    // Waveform section
    auto waveformHeight = proportionOfHeight(0.25f);
    auto waveformArea = area.removeFromTop(waveformHeight);
    waveformDisplay.setBounds(waveformArea);

    // Play/Pause button and track position slider
    auto controlsHeight = 60;
    auto controlsArea = area.removeFromTop(controlsHeight);

    playPauseButton.setBounds(controlsArea.removeFromLeft(60).reduced(5));

    auto sliderLabelHeight = 20;
    auto posSliderArea = controlsArea.removeFromTop(controlsArea.getHeight() - sliderLabelHeight);
    posSlider.setBounds(posSliderArea.reduced(5));

    auto labelArea = controlsArea.removeFromBottom(sliderLabelHeight);
    trackPosLabel.setBounds(labelArea.reduced(5));

    // Rotating CD area
    auto cdArea = area.removeFromTop(190);
    rotatingCDRect = cdArea;

    // Bottom area for volume & speed vertical sliders
    auto bottomArea = area;
    auto halfWidth = bottomArea.getWidth() / 2;

    auto volArea = bottomArea.removeFromLeft(halfWidth);
    volSlider.setBounds(volArea.removeFromTop(volArea.getHeight() - 30).reduced(10));
    volumeLabel.setBounds(volArea.removeFromBottom(25).reduced(5));

    speedSlider.setBounds(bottomArea.removeFromTop(bottomArea.getHeight() - 30).reduced(10));
    speedLabel.setBounds(bottomArea.removeFromBottom(25).reduced(5));

    // Loop checkbox
    loopToggle.setBounds(area.removeFromBottom(25).withSizeKeepingCentre(70, 20));
}

// Buttons
void DeckGUI::buttonClicked(Button* button)
{
    // Changes the text to display the current state 
    if (button == &playPauseButton)
    {
        if (!isPlaying)
        {
            player->start();
            isPlaying = true;
            playPauseButton.setButtonText("Stop");
        }
        else
        {
            player->stop();
            isPlaying = false;
            playPauseButton.setButtonText("Play");
        }
    }
    // Looping logic for specific decks 
    else if (button == &loopToggle)
    {
        // Turn looping on/off for this player's deck
        player->setLooping(loopToggle.getToggleState());
    }
}

void DeckGUI::sliderValueChanged(juce::Slider* slider)
{
    if (slider == &volSlider)
    {
        player->setGain(slider->getValue());
    }
    // Extra feature in here to increase/decrease the CD spin speed when the speed slider is manipulated
    else if (slider == &speedSlider)
    {
        player->setSpeed(slider->getValue());
        cdSpinSpeed = slider->getValue() * 0.05f;
    }
    // Track position slider
    else if (slider == &posSlider)
    {
        // Check for if the user is changing the track position manually, else the track positon slider will match the track position during playback
        if (isUserChangingPosSlider) 
        {
            player->setPositionRelative(slider->getValue());
        }
    }
}

// Functions that allow dragging files into the program
bool DeckGUI::isInterestedInFileDrag(const StringArray& /*files*/)
{
    return true;
}

void DeckGUI::filesDropped(const StringArray& files, int /*x*/, int /*y*/)
{
    if (files.size() == 1)
    {
        File file = File{ files[0] };
        if (file.existsAsFile())
        {
            loadFileIntoDeck(file);
        }
    }
}

// Timer calls for animations, waveform and trackpos tracking
void DeckGUI::timerCallback()
{
    if (isPlaying)
    {
        // Adjusts the spinning speed of the CD based on the previously mentioned increase/ decrease of the speed slider
        rotationAngle += cdSpinSpeed; 
        if (rotationAngle >= juce::MathConstants<float>::twoPi)
            rotationAngle -= juce::MathConstants<float>::twoPi; 
    }
    // Track positon tracking on the waveform itself
    waveformDisplay.setPositionRelative(player->getPositionRelative());

    // Override for the position slider when the user is manually changing the track positon
    if (!isUserChangingPosSlider)
    {
        posSlider.setValue(player->getPositionRelative(), juce::dontSendNotification);
    }
    // Repaints constantly to reflect rotation and position changes
    repaint(); 
}

// Loads file onto deck
void DeckGUI::loadFileIntoDeck(const File& file)
{
    player->loadURL(URL{ file });
    waveformDisplay.loadURL(URL{ file });
}

// As mentioned previously, these functions check if the slider is being dragged by user
void DeckGUI::sliderDragStarted(juce::Slider* slider)
{
    if (slider == &posSlider)
    {
        isUserChangingPosSlider = true; 
    }
}

void DeckGUI::sliderDragEnded(juce::Slider* slider)
{
    if (slider == &posSlider)
    {
        // Allow auto-updating after release
        isUserChangingPosSlider = false;
    }
}

