import genome 
from xml.dom.minidom import getDOMImplementation
from enum import Enum
import numpy as np

class MotorType(Enum):
    PULSE = 1
    SINE = 2

class Motor:
    def __init__(self, control_waveform, control_amp, control_freq):
        if control_waveform <= 0.5:
            self.motor_type = MotorType.PULSE
        else:
            self.motor_type = MotorType.SINE
        self.amp = control_amp
        self.freq = control_freq
        self.phase = 0
    

    def get_output(self):
        self.phase = (self.phase + self.freq) % (np.pi * 2)
        if self.motor_type == MotorType.PULSE:
            if self.phase < np.pi:
                output = 1
            else:
                output = -1
            
        if self.motor_type == MotorType.SINE:
            output = np.sin(self.phase)
        
        return output 

class Creature:
    def __init__(self, gene_count):
        self.spec = genome.Genome.get_gene_spec()
        self.dna = genome.Genome.get_random_genome(len(self.spec), gene_count)
        self.flat_links = None
        self.exp_links = None
        self.motors = None
        self.start_position = None
        self.last_position = None

    def get_flat_links(self):
        if self.flat_links == None:
            gdicts = genome.Genome.get_genome_dicts(self.dna, self.spec)
            self.flat_links = genome.Genome.genome_to_links(gdicts)
        return self.flat_links
    
    def get_expanded_links(self):
        self.get_flat_links()
        if self.exp_links is not None:
            return self.exp_links
        
        exp_links = [self.flat_links[0]]
        genome.Genome.expandLinks(self.flat_links[0], 
                                self.flat_links[0].name, 
                                self.flat_links, 
                                exp_links)
        self.exp_links = exp_links
        return self.exp_links

    def to_xml(self):
        self.get_expanded_links()
        domimpl = getDOMImplementation()
        adom = domimpl.createDocument(None, "start", None)
        robot_tag = adom.createElement("robot")
        for link in self.exp_links:
            robot_tag.appendChild(link.to_link_element(adom))
        first = True
        for link in self.exp_links:
            if first:# skip the root node! 
                first = False
                continue
            robot_tag.appendChild(link.to_joint_element(adom))
        robot_tag.setAttribute("name", "pepe") #  choose a name!
        return '<?xml version="1.0"?>' + robot_tag.toprettyxml()

    def get_motors(self):
        self.get_expanded_links()
        if self.motors == None:
            motors = []
            for i in range(1, len(self.exp_links)):
                l = self.exp_links[i]
                m = Motor(l.control_waveform, l.control_amp,  l.control_freq)
                motors.append(m)
            self.motors = motors 
        return self.motors 

    # --------- Mountain / evaluation helpers ---------

    def reset_episode_stats(self):
        """Reset per-run metrics (call automatically on first position update)."""
        self.max_z = None
        self.best_peak_dist = None
        self.air_steps = 0
        self.supported_steps = 0
        self.total_steps = 0
        self._peak_pos = None

    def get_max_height(self):
        return 0.0 if self.max_z is None else float(self.max_z)

    def get_best_peak_distance(self):
        # If never computed, return +inf so fitness becomes minimal.
        return float("inf") if self.best_peak_dist is None else float(self.best_peak_dist)

    def get_air_ratio(self):
        if self.total_steps <= 0:
            return 0.0
        return float(self.air_steps) / float(self.total_steps)

    def get_supported_ratio(self):
        if self.total_steps <= 0:
            return 0.0
        return float(self.supported_steps) / float(self.total_steps)

    def get_mountain_fitness(self):
        """
        Fitness for Part B:
        - Reward closeness to peak (smaller distance -> higher score)
        - Penalize being airborne ("cheating") via supported_ratio
        """
        d = self.get_best_peak_distance()
        closeness = 1.0 / (1.0 + d)  # in (0, 1]
        # If we never provided support info, default to no penalty.
        support = self.get_supported_ratio() if (self.air_steps + self.supported_steps) > 0 else 1.0
        return closeness * support

    
    def update_position(self, pos, supported=None, peak_pos=None):
        """
        Update creature position and (optionally) per-step mountain metrics.
        - supported: bool (True if touching floor/mountain; False if airborne)
        - peak_pos: (x, y, z) position of mountain peak for distance-to-peak tracking
        """
        # First-ever position update for this creature in this run
        if self.start_position is None:
            self.start_position = pos
            self.last_position = pos
            self.reset_episode_stats()
        else:
            self.last_position = pos

        # Track peak position if provided
        if peak_pos is not None:
            self._peak_pos = peak_pos

        # Update per-step metrics
        self.total_steps += 1

        # Max height reached
        z = pos[2]
        if self.max_z is None or z > self.max_z:
            self.max_z = z

        # Closest distance to peak (if peak known)
        if self._peak_pos is not None:
            p = np.asarray(pos, dtype=float)
            peak = np.asarray(self._peak_pos, dtype=float)
            dist = float(np.linalg.norm(p - peak))
            if self.best_peak_dist is None or dist < self.best_peak_dist:
                self.best_peak_dist = dist

        # Air vs supported tracking (if provided)
        if supported is not None:
            if supported:
                self.supported_steps += 1
            else:
                self.air_steps += 1


    def get_distance_travelled(self):
        if self.start_position is None or self.last_position is None:
            return 0
        p1 = np.asarray(self.start_position)
        p2 = np.asarray(self.last_position)
        dist = np.linalg.norm(p1-p2)
        return dist 

    def update_dna(self, dna):
        self.dna = dna
        self.flat_links = None
        self.exp_links = None
        self.motors = None
        self.start_position = None
        self.last_position = None
        self.reset_episode_stats()