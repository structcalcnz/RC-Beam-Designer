
# User Manual and Technical Specification
# Simple Reinforced Concrete Beam Designer
(Version: 1.0a)

Design Standard: NZS 3101

---

## 1. Development Environment
The RC Beam Designer application is built with a modern, lightweight front-end stack to ensure fast performance, maintainability, and compatibility across platforms.
*   **Framework:** React V18+
*   **Build Tool:** Vite
*   **Language:** Typescript
*   **Styling:** Tailwind CSS + Shadcn UI
*   **State Management:** Zustand
*   **Utilities:** UUID for unique identifiers
*   **Compatibility:** Optimized for modern browsers including Chrome, Firefox, Edge, and Safari

## 2. User Interface Overview

The application interface is designed to be clear, intuitive, and responsive, ensuring a smooth workflow for structural design tasks. The main layout is divided into four key areas:

### 2.1 Sidebar
The sidebar provides quick access to project and application-level controls:
*   **Project Name & Menu:** Start new project, save and load project files for continued work.
*   **Navigation:** Links to major input and output sections.
*   **Theme Settings:** Toggle between light and dark modes.
*   **Help / About:** Basic information about the application.

### 2.2 Input & Output Panels
Central panels allow users to define inputs and review results:
*   **Job Setup** – Define project name, designer, and design notes etc.
*   **Design Loads** – Input applied moment and shear.
*   **Geometry** – Specify beam dimensions and reinforcement cover.
*   **Materials** – Select material type (Concrete | Masony), concrete strength, steel grade.
*   **Calculate Options** – Generate design recommendations based on inputs.
*   **Final Design** – Review and confirm the selected reinforcement layout to conduct a full code-complication check.
*   **SLS Design** – Check serviceability limit states (e.g., short-term deflection stiffness, crack width).

### 2.3 Preview Panel

Provides a real-time graphical preview of the beam cross-section.
Displays reinforcement arrangement and geometry updates instantly as inputs are modified.

### 2.4 Footer

The footer contains contextual information:
*   **Status Messages** – Feedback on calculations and actions.
*   **Units** – Indication of current unit system (metric).
*   **Version Info** – Application build and version number.
>💡Note: the footer is hidden on smaller screens to maximize workspace.

## 3. Getting Started

This section provides an overview of the workflow for setting up and running a beam design in the application.
### 3.1 Job Setup

* Enter project information such as project name, designer, and notes.
* Define a Beam Mark, an identifier for the beam.
>💡Note: This information will be used for generating the report title block in future development.

### 3.2 Design Loads

* Input the design moment $M^∗$ and design shear $V^∗$.
* Enter the strength reduction factors ($\phi$) for moment and shear.
> Note: Axial load $N^*$ is not included in the current version but is part of the future development roadmap.

### 3.3 Beam Geometry

* Specify section breadth 𝐵, depth 𝐷, and cover (applied equally on all sides) in mm.
* Define the span in meters (currently not used in calculations).

### 3.4 Material Properties
* Select section material: Concrete | Masonry (concrete masonry units)
* Define concrete strength $f'_c$ in MPa (typical values: 20, 25, 30, 35, 40, 45, 50 MPa).
* Select reinforcement grades for main bars and stirrups (300E and 500E).  
  For older buildings, 250 MPa reinforcement may be used.
* The modulus of elasticity of concrete ($E_c$) is automatically derived from inputs.

### 3.5 Design Options
* Run calculations to generate reinforcement recommendations.
* Options provide an overview of reinforcement utility ratios.
* If suggested reinforcement cannot be arranged in a single layer, a warning is shown.
>❗Note: Multi-layer layouts are not supported in this version.
* Selecting an option row will populate the Final Design section.

### 3.6 Final Design Details
By default, an initial reinforcement setup is shown: 2HD16 + R10@200 (2-leg).

Users may:
*   Directly adjust reinforcement inputs, or
*   Select a configuration from Design Options for detailed checks.

For Masonry sections, input $v_m$ (masonry shear strength) as per NZS 4230.  
Option to waive minimum shear reinforcement checks as per NZS 3101 Cl. 9.3.9.4.13 (e.g., slabs ≤ 250 mm).

Detailed checks include:
*   Minimum reinforcement area, $A_{s,Min}$
*   Neutral axis depth, $c$ (to avoid premature concrete failure)
*   Flexural and shear capacities ($\phi M_n$ and $\phi V_n$)
*   Minimum stirrup area, $A_{sv,Min}$
*   Maximum stirrup spacing, $s_s$, and leg spacing, $s_l$
>💡Note: Recommended options may not fully satisfy all checks. Adjust reinforcement and re-check as needed.

### 3.7 SLS Checks
Input:
*   Service moment $M_s$ (typically $𝑀_s=0.6\text{ -- } 0.8M^*$)
*   Concrete shrinkage strain (typical 400–700 × 10⁻⁶ in New Zealand)
*   Crack width limit, $w_{max}$ (default 0.3 mm, as per NZS 3101 Table C2.1 or project requirements)

Outputs:
*   Steel stress under ULS and SLS, $f_{su}$ and $f_{ss}$
*   Additional steel stress due to concrete shrinkage
*   Calculated crack width, $w$ (mm)
*   Effective second moment of area ($I_e$)
*   Long-term creep factor, $K_{cp}$ (per NZS 3101 Section 6.8)
>💡Note: If the calculated crack width exceeds the limit, increase main reinforcement area and re-check.
>❗Note: SLS checks are not applicable for masonry sections.

### Project Management
*   Use the sidebar menu ☰ to create a new project, save the current project to a `.json` file, or load a previously saved project.
*   Saved files include all input data for easy resumption of work. After loaded a saved file, it needs to run all the checks again to get all the outputs.

## 4. Design Options Generation

The application automatically generates and evaluates reinforcement layouts for rectangular beams based on the input design forces, geometry, and material properties.
#### Preliminary vs Detailed Checks

- **Preliminary sizing:** Design Options generation uses the steel yield stress ($f_y$) as the tension force for moment capacity checks (i.e. $T=A_sf_y$). This provides a conservative and fast screening of candidate layouts and ensures preliminary moment capacity is not under-estimated.

- **Detailed verification:** The actual steel stress (elastic or yielded) and neutral axis location are computed in the Detailed Design phase. The detailed check evaluates the elastic steel stress $f_s = E_s ε_s$ and will switch to the yielded branch where appropriate (however, overstrength behavior beyond yield is not considered in the current version). Where the yielded assumption applies ($f_s=f_y$), the corresponding ultimate flexural capacity is accepted as the section’s design strength.

- **Warning / remediation:** If a candidate passes the preliminary check but fails detailed verification (e.g., section too shallow, excessive $f_s$, or shear/minimum reinforcement checks), the option is flagged and the designer should increase As, change bar layout, or adjust geometry.

### Bar Sizes & Stirrup Options

-   **Main reinforcement bars (db):** 12, 16, 20, 25 mm
-   **Stirrups (ds):** 6, 10, 12 mm
-   **Stirrup legs:** 2, 3, or 4
-   **Stirrup spacing (s<sub>s</sub>):** 50–300 mm (in increments of 50 mm)

### Process

#### 1. Stress Block Factor (α₁,β₁) as per NZS 3101 7.4.27.
$$\alpha_1 = 0.85 \text{ where, f'c <55MPa}$$
  

$$
\beta_1 =
\begin{cases}
0.85 & \text{if } f_c' \le 30 \text{ MPa} \\
0.85 - 0.008(f_c' - 30), \text{ with a minimum of 0.65} & \text{if } f_c' > 30 \text{ MPa}
\end{cases}
$$

#### 2. Effective Depth (d)
$$
d = D - \text{cover} - d_s - \frac{d_b}{2}
$$

#### 3. Minimum Steel Area (A<sub>s,min</sub>) (NZS 3101)
$$
A_{s,min} = \frac{\sqrt{f_c'}}{4f_y} b d
$$

#### 4. Required Steel Area (A<sub>s,req</sub>)
To calculate thee required steel area, start with the moment capacity equation:

$$
\frac{M^*}{\phi_b} = T \left( d_0 - \frac{1}{2} a \right)
$$

*where,*

$$a = \frac{C}{\alpha_1 f_c' B}$$

Under equilibrium, we assume the tensile force $T$ equals the compressive force $C$, and is determined by the steel yield:

$$
T = C = A_s f_y
$$

Substitute the expressions for $a$ and $T$ into the moment equation:

$$
\frac{M^*}{\phi_b} = A_s f_y \left( d_0 - \frac{1}{2} \frac{A_s f_y}{\alpha_1 f_c' B} \right)
$$

Rearrange the terms to form a quadratic equation in the form of $a_q x^2 + b_q x + c_q = 0$, where the unknown is the area of steel, $A_s$:

$$
\underbrace{\left( \frac{f_y^2}{2 \alpha_1 f_c' B} \right)}_{a_q} A_s^2 - \underbrace{\left( f_y d_0 \right)}_{b_q} A_s + \underbrace{\left( \frac{M^*}{\phi_b} \right)}_{c_q} = 0
$$

This is calculated from the quadratic equilibrium equation where:

- $$a = \frac{f_y^2}{2 \alpha_1 f_c' b}$$
- $$b = -f_y d$$
- $$c = \frac{M}{\phi_b}$$

The required steel area is the minimum positive root of:

$$
A_{s,req} = \min\left(\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}\right)
$$

#### 5. Provided Steel Area (A<sub>s,prov</sub>)

$$
A_{s,prov} = n \cdot \frac{\pi d_b^2}{4}
$$

&nbsp;&nbsp;*Where, 'n' is the number of bars.*

#### 6. Bar Spacing Check
This step ensures that the reinforcing bars fit within a single layer with a clear spacing greater than or equal to the maximum of the bar diameter (db) and 25 mm. Layouts requiring multiple layers are flagged with a warning.
> ❗ Note: Multi-layer layouts are not supported in this version. Use larger bars or increase section depth if needed.

#### 7. Nominal Moment Capacity (Mₙ)
First, calculate the depth of the equivalent rectangular stress block:

$$
a = \frac{A_{s,prov} f_y}{\alpha_1 f_c' b}
$$

Then, calculate the nominal moment capacity:

$$
M_n = A_{s,prov} f_y \left(d - \frac{a}{2}\right)
$$

#### 8. Moment Utilization Ratio (M<sub>util</sub>)
$$
M_{util} = \frac{M^*}{\phi_b M_n}
$$

#### 9. Shear Capacity
**Concrete Shear Contribution (V<sub>c</sub>):**
Based on NZS 3101 expressions, with the following limits:

$$
V_c = v_c b d
$$

*Where v<sub>c</sub> is between [0.08√f<sub>c</sub>', 0.2√f<sub>c</sub>'] and the nominal shear stress v<sub>n</sub> ≤ min(0.2f<sub>c</sub>', 8 MPa).*
>💡 Note: the minimum shear stress of the concrete is defined to min(0.2f<sub>c</sub>', 10 MPa).  
&emsp; For masonry sections, v<sub>c</sub> is taken as 0 (masonry shear strength) in the design options generating process.

**Stirrups Contribution (V<sub>s</sub>):**

$$
V_s = \frac{A_v f_{ys} d}{s}
$$

&nbsp;&nbsp; *Where the area of shear reinforcement A<sub>v</sub> is:*

$$
A_v = \text{legs} \cdot \frac{\pi d_s^2}{4}
$$

**Total Shear Capacity (V<sub>n</sub>):**

$$
V_n = V_c + V_s
$$

#### 10. Shear Utilization Ratio (V<sub>util</sub>)
$$
V_{util} = \frac{V^*}{\phi_s V_n}
$$

### Result Filtering

-   Only options where both **M<sub>util</sub> ≤ 0.95** and **V<sub>util</sub> ≤ 0.95** are retained.
-   Warnings are issued for designs with insufficient reinforcement or bar spacing conflicts.

### Ranking

-   Valid options are sorted by their combined utilization (**M<sub>util</sub> + V<sub>util</sub>**) to highlight the most efficient layouts.

## 5. Detailed Design and SLS Checks
### 5.1. Overview

After generating reinforcement options, the Detailed Design phase performs a comprehensive verification of the selected configuration. The checks evaluate:

-   Neutral axis depth and ductility
-   Moment and shear capacity
-   Minimum and maximum reinforcement limits
-   Stirrup layout constraints

Furthermore, The SLS Design ensures that beam deflections, crack widths, and rebar stresses under service loads remain within acceptable limits. It incorporates:

-   Elastic or yielded steel stress evaluation under service moments
-   Additional steel stress induced by concrete shrinkage
-   Crack width estimation
-   Effective stiffness of the cracked section
-   Long-term deflection factors (creep, sustained loads)

The process ensures compliance with NZS 3101 and flags any adjustments needed before finalizing the design.

### 5.2. Detailed Check Process

#### Effective Depth and Reinforcement Area

-   Calculates effective depth $d = D - \text{cover} - d_s - d_b/2$
-   Calculates total tension reinforcement area $A_s = n \cdot (\pi d_b^2 / 4)$
-   Computes reinforcement ratio $\rho = A_s / (B \cdot d)$

#### Minimum Reinforcement Check
$$
A_{s,min} = \max\left(\frac{\sqrt{f_c'}}{4f_y} B d, \frac{1.4}{f_y} B d\right)
$$
-   Ensures provided $A_s \ge A_{s,min}$

#### Neutral Axis Depth and Ductility

-   Concrete stress block depth:

 $$ a = \frac{A_s f_y}{\alpha_1 f_c' B}, \text{ with } \alpha_1 = 0.85 \text{ for } f_c' \le 55 MPa$$

-   Neutral axis: $c = a / \beta_1$, where $\beta_1$ is per NZS 3101 7.4.27.
-   Checks against ductility limit $c \le 0.75 c_b$, where $c_b = d \cdot \epsilon_c / (\epsilon_c + \epsilon_s)$

#### Moment Capacity Verification

-   Nominal moment capacity: $M_n = A_s f_y (d - a/2)$
-   Design moment: $\phi M_n$ is compared with the applied moment $M^*$

#### Shear Capacity Verification

-   Concrete shear $V_c$ is calculated per material type (concrete or masonry) and section properties
-   Shear reinforcement $V_s = (A_v f_{ys} d) / s$
-   Nominal shear: $V_n = V_c + V_s$
-   Design shear: $\phi_s V_n$ is compared with the applied shear $V^*$

#### Stirrup Checks

-   Minimum shear reinforcement is provided if $V^* > 0.5 \phi_s V_c$ and is not waived.
-   Maximum stirrup spacing $s_{max} = \min(0.5d, 600 \text{ mm})$, adjusted for high shear conditions.
-   Maximum leg spacing is evaluated if multiple legs per stirrup are used.

#### Warnings and Notes
-   **Side bar checks is not provided in this version.**
-   **Where design the capacity for a overstrength loads, reduction factor $\phi$ can be taken as 1.0. But it is notable the overstrength properties, especially for the material strains, are not applied in this version**
-   Any violations, such as insufficient reinforcement or spacing conflicts, are flagged.
-   Notes include component breakdowns (e.g., $V_c$, $V_s$).

### 5.3. SLS (Serviceability Limit State) Checks

#### Input Parameters

-   SLS bending moment $M_{SLS}$
-   Concrete shrinkage strain $\epsilon_{sh}$ (default 400–700 µε)  
    To estimate shrinkage strain, refer to NZS 3101 Appendix E. However, studies and reashes shows that the shrinkage strain in New Zealand is typically in the range of 400–700 µε, with considering 50%-70% related humidity and 15°C themal defference to the peak hytration.
-   Crack width limit $w_{max}$ refer to NZS 3101 Table C2.1 (default 0.3 mm).

#### Estimated Steel Stress
Equilibrium (with Whitney block) and moment balance:
-   Compressive force in concrete $C = \alpha_1 f'_c \beta_1 c B$
-   Tensile force in steel $T = A_s f_s$
-   Force and Moment equilibrium $C = T$ and $M_c+M_s+M_n=M^*/\phi_b$  
where, $M_s = T (d - c)$ $Mc = C (c - a/2)$ and $M_n=0$
-   Using $C=T$, the moment equation reduces to:

$$ C (d - \frac{\beta_1}{2}c) = \frac{M^*}{\phi_b} $$

-   Substitute the expression for the compressive force, $C = 0.85 f_c' \beta_1 c B$, into the moment equation:

$$
0.85 f_c' \beta_1 c B \left[ d - \frac{\beta_1}{2} c \right] = \frac{M^*}{\phi_b}
$$

-   This equation is quadratic in terms of the neutral axis depth, $c$. Solving for $c$ yields the physically admissible root:

$$
c = \frac{d - \sqrt{d^2 - \frac{2 M^*/\phi_b}{0.85 f_c' B}}}{\beta_1}
$$

> *Note: The negative root is chosen so that as the applied moment $M^*$ approaches zero, the neutral axis depth $c$ also approaches zero.*

With the neutral axis depth determined, the following can be calculated:
-   **Compressive Force:** $C = 0.85 f_c' \beta_1 c B$
-   **Steel Stress:** $f_s = \displaystyle\frac{C}{A_s}$
-   **Curvature:** $\phi_c = \displaystyle\frac{f_s}{E_s (d - c)}$

- If the computed steel stress $f_s = C/A_s$ exceeds yield $f_y$, the linear-elastic assumption is violated.
In that case, yielded steel case should be solved piecewise:
-   Set $T=A_sf_y$, and solve for $c$ from the force equilibrium $C=T$: 

$$c = \frac{A_s f_y}{0.85 f_c' \beta_1 B} $$
    
-   then check the mement $C(d-0.5*\beta_1c)$ against $M^*$.
#### Shrinkage-Induced Steel Stress
-   Calculates effective reinforcement ratio $\rho = A_s / (B \cdot D)$
-   Computes concrete modulus of elasticity $E_c = 4700 \sqrt{f'_c}$
-   Computes steel modulus of elasticity $E_s = 200000$ MPa
-   Calculates transformed section ratio $n = E_s / E_c$
-   Using the transformed-section simple estimate:

$$ f_{s,c} ≈ E_s \varepsilon_{sh} \frac{\rho}{1 + \rho n} $$

-   Accounts for additional stress due to concrete shrinkage: $f_{s,sh} = 0.5 f_{s,c}$. Only half of the induced stress is used to account for laboratory-based calibration.

#### Crack Width Estimation

-   **Effective steel stress:**

    $$
    f_{s,ch} = f_s + 0.5f_{sc}
    $$

-   **Maximum distance from extreme fiber to tension steel centroid:**

    $$
    g_s = \sqrt{\left(\frac{s}{2}\right)^2 + \left(\text{cover} + d_s + \frac{d_b}{2}\right)^2} - \frac{d_b}{2}
    $$

-   **Crack width:**

    $$
    w = 2 g_s \frac{f_{s,ch}}{E_s} \quad [\text{mm}]
    $$

>❗Note: the reinforcement spacing limit for crack control of a slab or wall member is not considered in this version. The user shall check the spacing limit according to NZS 3101.
#### Effective Section Stiffness ($I_e$)

-   **Cracked section inertia:**

    $$
    I_{cr} = \frac{B x^3}{3} + \frac{E_s}{E_c} A_s (d - x)^2
    $$

&nbsp;&nbsp;where, $x$ is the estimated nuetral axis depth for the cracked section (no tension contributed by concrete).
-   **Effective inertia for SLS moment $M_{SLS}$:**

    $$
    I_e =
    \begin{cases}
    I_g, & \text{if } M_{SLS} \le M_{cr} \\
    \left(\frac{M_{cr}}{M_{SLS}}\right)^3 I_g + \left[1 - \left(\frac{M_{cr}}{M_{SLS}}\right)^3\right] I_{cr}, & \text{if } M_{SLS} > M_{cr}
    \end{cases}
    $$

#### Long-term Factor (Kcp)

This factor accounts for creep and sustained load effects on deflection:

$$
K_{cp} = \frac{2}{1 + 50 \rho'}
$$

Where $\rho'$ is the compression reinforcement ratio. 
>❗Note: The application assumes 2HD12 as compression reinforcement for this calculation.

#### Output

-   Rebar stresses under ULS (Ultimate Limit State) and SLS.
-   Additional rebar stress from shrinkage.
-   Crack width $w$.
-   Effective section stiffness $I_e$ and long-term deflection factor $K_{cp}$.

### 5.4. Integration with Design Options

-   Users select a reinforcement option from the "Design Options Generation" results.
-   The "Detailed Check" recalculates stresses, moments, and shear using actual steel yield assumptions.
-   It flags adjustments for minimum reinforcement, spacing, and ductility violations.
-   The SLS check ensures serviceability criteria are met, including shrinkage effects on cracks and deflection.

## 6. Feuture Roadmap & Custom Development

The current version focuses on preliminary RC beam design checks under flexure, using single-layer reinforcement and simplified serviceability criteria. Future development will target a more comprehensive structural modeling framework with the following capabilities:
* **Material Nonlinear Behavior**
  * Explicit design checks for steel yielding, concrete crushing, steel fracture, and concrete failure states.
  * Incorporation of overstrength behavior to capture reserve strength beyond first yield.
* **Advanced Reinforcement Configurations**
  * Support for multiple reinforcement layers in tension zones.
  * Inclusion of compression reinforcement with strain compatibility analysis.
* **Axial Load & Column Design**
  * Extend beyond pure flexure to handle axial load–moment interaction.
  * Enable column design with full P–M interaction analysis for combined axial and bending effects.
* **Custom Development Hooks**
  * Modular functions for custom constitutive models (steel or concrete).
  * Extendable design checks for project-specific criteria or code calibrations.
* **Enhanced Reporting**
  * Automated generation of detailed design reports with calculations, assumptions, and compliance statements.
  * Exportable formats (PDF, DOCX) for professional documentation.

This roadmap will transform the application from a preliminary beam design tool into a versatile platform for reinforced concrete element analysis and design.

For the latest release information, tools, guides, and updates, please visit the [StructCalcNZ Google Site](https://sites.google.com/view/nzsc-team/tools-articles).  
If you require tailored features or custom development, please contact **structcalcnz@gmail.com**.

## 8. General Suggestions

We strongly recommend that you save the data regularly to avoid data loss in case of errors or corruption accidentally. To export the data:
*   Use “Save Design” to save the lintel data to an external file regularly.

In case the app encounters errors:
*   **Step 1:** Refresh the web page (you will lose all exisitng inputs).
*   **Step 2:** If the problem continues, close your browser and reopen.

**Important Notice:**
This tool is for preliminary sizing only. All reinforcement designs must be reviewed and approved by an authorized structural engineer prior to construction.

**Reporting a Bug / Request for Protected Sheets Password**
If you encounter any issues or bugs with the spreadsheet, please follow these steps:

**To Report a Bug:**
Email us with a detailed description of the issue, including any error messages encountered, steps to reproduce the problem, your browser and it's version.
Contact Email: structcalcnz@gmail.com

## Copyright and Disclaimer

© 2025 StructCalcNZ. All rights reserved.

This web app is provided as a design aid for rectangular RC beam. You are free to use this app for non-commercial and commercial purposes.

**Modification of the underlying code, scripts, or any internal functionality of this app without permit is strictly prohibited.**

This tool is not a substitute for construction purpose without professional engineering judgment. The user assumes full responsibility for all design work and the accuracy of inputs and results. All designs must be reviewed and approved by an authorized structural engineer or timber supplier prior to construction.

For full licensing details, limitations, and warranty disclaimers, please refer to the [LICENSE](/LICENSE.txt) file in this repository.

For any queries regarding usage or distribution, or to report a bug, please contact: structcalcnz@gmail.com