/*
  ==============================================================================

    MusicLibraryComponent.cpp
    Created: 6 Mar 2025 5:57:55pm
    Author:  Admin

  ==============================================================================
*/

#include "MusicLibraryComponent.h"

// Main initalisation for the library, calls to DeckGUI
MusicLibraryComponent::MusicLibraryComponent(DeckGUI* deck1Gui, DeckGUI* deck2Gui)
    : deck1(deck1Gui),
    deck2(deck2Gui)
{
    // Add buttons
    addAndMakeVisible(uploadBtn);
    addAndMakeVisible(clearBtn);
    addAndMakeVisible(deleteBtn);
    addAndMakeVisible(loadDeck1Btn);
    addAndMakeVisible(loadDeck2Btn);

    // Attach listeners
    uploadBtn.addListener(this);
    clearBtn.addListener(this);
    deleteBtn.addListener(this);
    loadDeck1Btn.addListener(this);
    loadDeck2Btn.addListener(this);

    // Add and set up the track list box
    addAndMakeVisible(trackListBox);
    trackListBox.setModel(this);

    loadLibraryFromFile();
}

// Removes listeners so that the buttons can be used again if needed
MusicLibraryComponent::~MusicLibraryComponent()
{
    uploadBtn.removeListener(this);
    clearBtn.removeListener(this);
    deleteBtn.removeListener(this);
    loadDeck1Btn.removeListener(this);
    loadDeck2Btn.removeListener(this);
}

// Paints the playlist section
void MusicLibraryComponent::paint(Graphics& g)
{
    // Matches the background for the main GUI
    g.fillAll(Colour::fromRGB(30, 30, 30)); 
    g.setColour(Colours::white);
    g.setFont(16.0f);
    g.drawText("Music Library", 10, 5, 200, 25, Justification::left);
}

// Initalises the GUI area designated for the library
void MusicLibraryComponent::resized()
{
    auto area = getLocalBounds().reduced(5);

    // Making space for the buttons
    auto buttonRow = area.removeFromTop(30);
    int eachWidth = buttonRow.getWidth() / 5;

    uploadBtn.setBounds(buttonRow.removeFromLeft(eachWidth).reduced(2));
    clearBtn.setBounds(buttonRow.removeFromLeft(eachWidth).reduced(2));
    deleteBtn.setBounds(buttonRow.removeFromLeft(eachWidth).reduced(2));
    loadDeck1Btn.setBounds(buttonRow.removeFromLeft(eachWidth).reduced(2));
    loadDeck2Btn.setBounds(buttonRow.removeFromLeft(eachWidth).reduced(2));

    // Remaining area is for the list box
    trackListBox.setBounds(area.reduced(2));
}

// Buttons (Listeners)
void MusicLibraryComponent::buttonClicked(juce::Button* button)
{
    if (button == &uploadBtn) { uploadAudio(); }
    else if (button == &clearBtn) { clearLibrary(); }
    else if (button == &deleteBtn) { deleteSelectedTrack(); }
    else if (button == &loadDeck1Btn) { loadToDeck(1); }
    else if (button == &loadDeck2Btn) { loadToDeck(2); }
}

// ListBoxModel
int MusicLibraryComponent::getNumRows()
{
    return trackNames.size();
}

// Adds in visual feedback when a track is selected from the library
void MusicLibraryComponent::paintListBoxItem(int rowNumber, juce::Graphics& g,
    int width, int height, bool rowIsSelected)
{
    if (rowIsSelected)
        g.fillAll(juce::Colours::lightblue.withAlpha(0.5f));

    if (rowNumber >= 0 && rowNumber < trackNames.size())
    {
        g.setColour(juce::Colours::white);
        g.setFont(14.0f);
        g.drawText(trackNames[rowNumber],
            5, 0, width - 10, height,
            juce::Justification::centredLeft);
    }
}

// MusicLibraryComponent.cpp
// Helper functions for the playlist functionality
// Upload tracks to the playlist
void MusicLibraryComponent::uploadAudio()
{
    // Launch file chooser to select an audio file
    fileChooser.launchAsync(juce::FileBrowserComponent::openMode | juce::FileBrowserComponent::canSelectFiles,
        [this](const juce::FileChooser& fc)
        {
            auto chosen = fc.getResult();
            if (chosen.existsAsFile())
            {
                saveLibraryToFile(chosen);  // Copy file and update list
            }
        });
}

// Clear the entire music library
void MusicLibraryComponent::clearLibrary()
{
    juce::File playlistFolder = getPlaylistFolder();

    // Delete all files in the directory
    playlistFolder.deleteRecursively();

    trackNames.clear();
    trackFiles.clear();
    trackListBox.updateContent();
}

// Delete a specific uploaded track
void MusicLibraryComponent::deleteSelectedTrack()
{
    int sel = trackListBox.getSelectedRow();
    if (sel >= 0 && sel < trackFiles.size())
    {
        auto* filePtr = trackFiles[sel];
        if (filePtr && filePtr->existsAsFile())
        {
            filePtr->deleteFile();
        }

        trackFiles.remove(sel);
        trackNames.remove(sel);
        trackListBox.updateContent();
    }
}

// Load the uploaded tracks to either deck
void MusicLibraryComponent::loadToDeck(int deckNumber)
{
    // Selection of the audio file
    int sel = trackListBox.getSelectedRow();
    if (sel >= 0 && sel < trackFiles.size())
    {
        auto* filePtr = trackFiles[sel];
        if (filePtr != nullptr && filePtr->existsAsFile())
        {
            // Load to deck 1
            if (deckNumber == 1 && deck1 != nullptr)
                deck1->loadFileIntoDeck(*filePtr);
            // Load to deck 2
            else if (deckNumber == 2 && deck2 != nullptr)
                deck2->loadFileIntoDeck(*filePtr);
        }
    }
}

// Return the file where we want to save/load the track list.
juce::File MusicLibraryComponent::getPlaylistFolder()
{
    return juce::File::getSpecialLocation(juce::File::currentApplicationFile)
        .getParentDirectory()
        .getChildFile("Playlist");
}


// Load all track file paths from disk and repopulate the library
void MusicLibraryComponent::loadLibraryFromFile()
{
    juce::File playlistFolder = getPlaylistFolder();

    // Ensure the Playlist directory exists
    if (!playlistFolder.exists())
        playlistFolder.createDirectory();

    trackNames.clear();
    trackFiles.clear();

    // Iterate through all files in the Playlist directory
    juce::Array<juce::File> files = playlistFolder.findChildFiles(juce::File::findFiles, false);
    for (juce::File file : files)
    {
        if (file.existsAsFile())
        {
            trackNames.add(file.getFileName());
            trackFiles.add(new juce::File(file));
        }
    }

    trackListBox.updateContent();
}


// Save all track file paths to disk
void MusicLibraryComponent::saveLibraryToFile(const juce::File& originalFile)
{
    juce::File playlistFolder = getPlaylistFolder();

    if (!playlistFolder.exists())
        playlistFolder.createDirectory();

    // Copy the file into the Playlist directory
    juce::File newFile = playlistFolder.getChildFile(originalFile.getFileName());
    originalFile.copyFileTo(newFile);

    // Add to the track list
    trackNames.add(newFile.getFileName());
    trackFiles.add(new juce::File(newFile));

    trackListBox.updateContent();
}

