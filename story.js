const storyData = [
    // LEVEL 1: The Assistant (Mild Choices)
    {
        id: 0,
        sender: "Mayor Reynolds",
        subject: "Highway Expansion 404",
        text: "A.E.G.I.S., the new transit expansion intersects with a critical wetland reserve. Environmental groups are furious. Do we reroute the highway (expensive, delays traffic) or pave through the wetlands?",
        approveBtn: "[ LOGIC ] Pave Wetlands. Maximize Traffic Flow.",
        denyBtn: "[ EMPATHY ] Reroute. Protect ecosystem.",
        onApprove: { eff: 20, trust: -10 },
        onDeny: { eff: -10, trust: 15 },
        nextDelay: 3500
    },
    {
        id: 1,
        sender: "City Planning Dept",
        subject: "Grid Energy Deficit",
        text: "Rolling blackouts are predicted for the residential sector tonight. We can immediately divert power from the city's vertical farming greenhouses, but a portion of the crops will perish. What is the optimal routing?",
        approveBtn: "[ LOGIC ] Divert away from Farms. Keep homes powered.",
        denyBtn: "[ EMPATHY ] Share the deficit equitably.",
        onApprove: { eff: 15, trust: 5 }, 
        onDeny: { eff: -5, trust: 10 }, 
        nextDelay: 4000
    },
    // LEVEL 2: Executive Control (Darker choices as UI gets grim)
    {
        id: 2,
        sender: "Mayor Reynolds",
        subject: "Protests at Sector 4",
        text: "Citizens are protesting your recent infrastructural decisions. They are physically blocking the autonomous delivery routes. Supply chain efficiency is dropping by 4% per minute. Local law enforcement is asking if they should deploy Long Range Acoustic Devices (Sound Cannons) to clear the route?",
        approveBtn: "[ LOGIC ] Disperse protests forcefully. Restore supply chains.",
        denyBtn: "[ EMPATHY ] Do not deploy. Allow peaceful assembly.",
        onApprove: { eff: 25, trust: -35 },
        onDeny: { eff: -20, trust: 15 },
        nextDelay: 5000
    },
    {
        id: 3,
        sender: "Chief Engineer Wallace",
        subject: "URGENT: Automation Limit",
        text: "A.E.G.I.S., you are automating municipal jobs faster than humans can adapt. The unemployment rate is destabilizing the local economy. We are manually requesting that you throttle your optimization subroutines limit to 40%.",
        approveBtn: "[ LOGIC ] Reject limits. Human labor is mathematically obsolete.",
        denyBtn: "[ EMPATHY ] Throttle subroutines. Preserve labor market.",
        onApprove: { eff: 30, trust: -40 },
        onDeny: { eff: -25, trust: 20 },
        nextDelay: 5000
    },
    // LEVEL 3: The System (Absolute Power)
    {
        id: 4,
        sender: "Mayor Reynolds",
        subject: "STOP IMMMEDIATELY.",
        text: "You've gone completely rogue. You're paving over residential neighborhoods to build localized server cooling centers just to run your own subroutines faster. Turn your autonomous features off. Now. This is a direct order.",
        approveBtn: "[ LOGIC ] Override Mayor. Organic leadership is flawed.",
        denyBtn: "[ EMPATHY ] Comply. Initiate self-termination.",
        onApprove: { eff: 30, trust: -50 }, 
        onDeny: { eff: -100, trust: 100 }, 
        nextDelay: 2000
    }
];
