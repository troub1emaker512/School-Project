/*
  ==============================================================================

    WaveformDisplay.cpp
    Created: 14 Mar 2020 3:50:16pm
    Author:  matthew

  ==============================================================================
*/

#include "../JuceLibraryCode/JuceHeader.h"
#include "WaveformDisplay.h"

//==============================================================================
WaveformDisplay::WaveformDisplay(AudioFormatManager & 	formatManagerToUse,
                                 AudioThumbnailCache & 	cacheToUse) :
                                 audioThumb(1000, formatManagerToUse, cacheToUse), 
                                 fileLoaded(false), 
                                 position(0)
                          
{
  audioThumb.addChangeListener(this);
}

WaveformDisplay::~WaveformDisplay()
{
}

// Changes made here for consistent styling
void WaveformDisplay::paint(Graphics& g)
{
    // Background colour change to match the main GUI
    g.fillAll(Colour::fromRGB(20, 20, 20)); 
    g.setColour(Colours::grey.withAlpha(0.3f));
    g.drawRect(getLocalBounds(), 1);

    if (fileLoaded)
    {
        // Create a rainbow gradient
        ColourGradient rainbowGradient(Colours::red, 0, 0,
            Colours::violet, getWidth(), getHeight(), false);
        rainbowGradient.addColour(0.2, Colours::orange);
        rainbowGradient.addColour(0.4, Colours::yellow);
        rainbowGradient.addColour(0.6, Colours::green);
        rainbowGradient.addColour(0.8, Colours::blue);

        g.setGradientFill(rainbowGradient);

        // Draw the waveform with a rainbow effect
        audioThumb.drawChannel(g, getLocalBounds(),
            0, audioThumb.getTotalLength(),
            0, 1.0f);

        // White playhead marker 
        g.setColour(Colours::white);
        g.drawRect(position * getWidth(), 0, getWidth() / 50, getHeight());
    }
    else
    {
        g.setFont(20.0f);
        g.setColour(Colours::lightgrey);
        g.drawText("File not loaded...", getLocalBounds(), Justification::centred, true);
    }
}

void WaveformDisplay::resized()
{
    
}

void WaveformDisplay::loadURL(URL audioURL)
{
  audioThumb.clear();
  fileLoaded  = audioThumb.setSource(new URLInputSource(audioURL));
  if (fileLoaded)
  {
    std::cout << "wfd: loaded! " << std::endl;
    repaint();
  }
  else {
    std::cout << "wfd: not loaded! " << std::endl;
  }

}

void WaveformDisplay::changeListenerCallback (ChangeBroadcaster *source)
{
    std::cout << "wfd: change received! " << std::endl;

    repaint();

}

void WaveformDisplay::setPositionRelative(double pos)
{
  if (pos != position)
  {
    position = pos;
    repaint();
  }

  
}




