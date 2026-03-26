/*
  ==============================================================================

    This file was auto-generated!

  ==============================================================================
*/

#include "MainComponent.h"

//==============================================================================

MainComponent::MainComponent()
{
    setSize(800, 1000);

    if (RuntimePermissions::isRequired(RuntimePermissions::recordAudio)
        && !RuntimePermissions::isGranted(RuntimePermissions::recordAudio))
    {
        RuntimePermissions::request(RuntimePermissions::recordAudio,
            [&](bool granted) { if (granted)  setAudioChannels(2, 2); });
    }
    else
    {
        setAudioChannels(0, 2);
    }

    formatManager.registerBasicFormats();

    addAndMakeVisible(deckGUI1);
    addAndMakeVisible(deckGUI2);
    // Add the track library
    addAndMakeVisible(musicLibrary);
}

MainComponent::~MainComponent()
{
    shutdownAudio();
}

void MainComponent::prepareToPlay(int samplesPerBlockExpected, double sampleRate)
{
    player1.prepareToPlay(samplesPerBlockExpected, sampleRate);
    player2.prepareToPlay(samplesPerBlockExpected, sampleRate);

    mixerSource.prepareToPlay(samplesPerBlockExpected, sampleRate);
    mixerSource.addInputSource(&player1, false);
    mixerSource.addInputSource(&player2, false);
}

void MainComponent::getNextAudioBlock(const AudioSourceChannelInfo& bufferToFill)
{
    mixerSource.getNextAudioBlock(bufferToFill);
}

void MainComponent::releaseResources()
{
    player1.releaseResources();
    player2.releaseResources();
    mixerSource.releaseResources();
}

void MainComponent::paint(Graphics& g)
{
    // Black background
    g.fillAll(Colour::fromRGB(20, 20, 20)); 
}

void MainComponent::resized()
{
    auto area = getLocalBounds();

    // Allocate height for the decks
    auto deckArea = area.removeFromTop(proportionOfHeight(0.7f));

    deckGUI1.setBounds(deckArea.removeFromLeft(deckArea.getWidth() / 2));
    deckGUI2.setBounds(deckArea);

    // Remaining space allocated for the Music Library
    musicLibrary.setBounds(area);
}

