"use client";

import { useState, useEffect } from "react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

const INTERVIEW_MESSAGES = [
  "Analyzing job description...",
  "Extracting key requirements...",
  "Matching skills with your resume...",
  "Consulting the AI brain...",
  "Crafting the perfect questions...",
  "Thinking really hard...",
  "Pinagoogling through databases...",
  "Summoning interview wisdom...",
  "Brewing some technical questions...",
  "Reading between the lines...",
  "Calculating difficulty levels...",
  "Mixing behavioral questions...",
  "Sprinkling some STAR method magic...",
  "Channeling inner recruiter energy...",
  "Decoding corporate buzzwords...",
  "Translating 'synergy' into real questions...",
  "Teaching AI what 'culture fit' means...",
  "Finding needles in resume haystacks...",
  "Asking the magic 8-ball...",
  "Reverse engineering interview patterns...",
  "Stealing questions from FAANG interviews...",
  "Pretending to be a hiring manager...",
  "Judging your LinkedIn profile...",
  "Making it sound professional...",
  "Adding that special sauce...",
  "Consulting with imaginary HR...",
  "Overthinking this a bit...",
  "Almost done, promise...",
  "Just a few more seconds...",
  "Putting on the final polish...",
  "Convincing the AI this matters...",
  "Checking if you can handle this...",
  "Generating questions you'll definitely bomb...",
  "Making sure these aren't too easy...",
  "Or too hard... finding balance...",
  "Predicting your nervous laughs...",
  "Writing down 'tell me about yourself'...",
  "Debating if LeetCode counts as experience...",
  "Wondering why you put '5 years React' for 2 years...",
  "Reading your 'passion for coding' claim...",
  "Fact-checking your project descriptions...",
  "Preparing 'where do you see yourself' variations...",
  "Making it interview-realistic...",
  "Avoiding cliché questions (mostly)...",
  "Throwing in a curveball or two...",
  "Balancing soft skills with hard truths...",
  "Adding questions about your gaps in employment...",
  "Preparing for your 'I'm a perfectionist' answer...",
  "Simulating awkward silence moments...",
  "Writing 'any questions for us?' prep...",
  "Channeling every interviewer ever...",
  "Remembering what 'team player' means...",
  "Researching what companies actually want...",
  "Ignoring your typos (for now)...",
  "Pretending years of experience matter...",
  "Calculating if you're overqualified...",
  "Or underqualified... hmm...",
  "Checking if 'fast learner' is still acceptable...",
  "Validating your tech stack claims...",
  "Cross-referencing with actual job needs...",
  "Adding the mandatory 'weakness' question...",
  "Spicing things up with scenarios...",
  "Making sure it's not too corporate-y...",
  "But also not too casual...",
  "Balancing the vibes...",
  "Testing your BS detector...",
  "Preparing to catch buzzword overload...",
  "Making this worth your time...",
  "Hopefully...",
  "Trust the process...",
  "AI is doing its thing...",
  "Beep boop generating questions beep boop...",
  "Counting your 'passionate' mentions...",
  "Questioning your GitHub gaps...",
  "Debating 'self-taught' vibes...",
  "Do you actually know those frameworks?...",
  "Calculating real salary expectations...",
  "Found that 3-month job you hid...",
  "Noticed 'Microsoft Office' as a skill...",
  "Spotting typos in 'detail-oriented'...",
  "Generating conflict scenarios...",
  "Predicting your sweat triggers...",
  "Writing 'why hire you' variations...",
  "Did you Google the company?...",
  "Preparing for your 'umm' pauses...",
  "Loading interviewer gotchas...",
  "Testing discomfort tolerance...",
  "What did you actually do though?...",
  "'Led a team' or just showed up?...",
  "Exposing skill level incoming...",
  "Does anyone know what 'agile' means?...",
  "What's a stakeholder anyway?...",
  "Creating impossible scenarios...",
  "Judging your career timeline...",
  "Raising eyebrows at job hopping...",
  "Preparing the salary negotiation trap...",
  "Writing questions with no right answer...",
  "Measuring your poker face ability...",
  "Testing if you read the job description...",
  "Checking for resume embellishments...",
  "Preparing the classic 'weakness' trap...",
];

const RESUME_GRILL_MESSAGES = [
  "Reading your resume... oh boy...",
  "Counting how many times you said 'passionate'...",
  "So you 'led a team of 10' huh? Let's see...",
  "Investigating that mysterious 6-month gap...",
  "Did you actually build that 'from scratch'?...",
  "Preparing to fact-check your bullet points...",
  "Getting ready to ask what you REALLY did...",
  "Noticed you're 'proficient' in 47 technologies...",
  "'Responsible for' count: off the charts...",
  "Analyzing your buzzword-to-substance ratio...",
  "Wondering if you know what 'synergy' means...",
  "Preparing questions about your 'leadership'...",
  "Did you Google this resume template?...",
  "Testing if 'team player' was just filler text...",
  "Crafting the 'explain this project' trap...",
  "Ready to hear about your 'greatest weakness'...",
  "Preparing for creative interpretations of truth...",
  "Loading the 'walk me through your code' question...",
  "So about those 'millions of users'...",
  "Getting skeptical about your GitHub stars...",
  "Designing questions you can't ChatGPT your way out of...",
  "Preparing to test that 'expert-level' claim...",
  "Did you really increase performance by 300%?...",
  "Ready to explore those vague achievements...",
  "Crafting follow-ups for your rehearsed answers...",
  "Preparing the 'tell me more' ambush...",
  "Testing if you actually used those frameworks...",
  "Getting ready to expose the embellishments...",
  "So you 'spearheaded' another initiative?...",
  "Preparing questions about what you DIDN'T do...",
  "Loading impossible scenario questions...",
  "Ready to test your actual technical depth...",
  "Crafting the 'explain it simply' challenge...",
  "Preparing to catch contradictions...",
  "About that 'innovative solution' you built...",
  "Testing if you can defend your tech choices...",
  "Getting ready to grill you on specifics...",
  "Preparing the 'why' questions...",
  "Loading questions that demand real examples...",
  "Ready to separate fluff from facts...",
  "Designing traps for generic answers...",
  "Preparing to test your problem-solving claims...",
  "So you 'optimized' everything, impressive...",
  "Getting ready to hear some creative stories...",
  "Crafting questions about your role vs. team's role...",
  "Testing those 'self-starter' credentials...",
  "Preparing to expose tutorial-following as 'building'...",
  "Ready to ask about failures, not just wins...",
  "Loading the 'what would you do differently' trap...",
  "Preparing to test your debugging stories...",
  "Getting ready to explore your weaknesses...",
  "Crafting questions about what went wrong...",
  "Testing if you learned from those 'challenges'...",
  "Preparing to hear about your management style...",
  "Ready to grill you on prioritization...",
  "Loading conflict resolution scenarios...",
  "Preparing questions about difficult teammates...",
  "Getting ready to test your humility...",
  "Almost done preparing your roast session...",
  "Final question prep... this will be fun...",
  "Ready to see if you can back it all up...",
];

const RESUME_UPLOAD_MESSAGES = [
  "Uploading your PDF...",
  "Scanning document structure...",
  "Extracting text from resume...",
  "Parsing your work history...",
  "Reading your education section...",
  "Identifying your skills...",
  "Analyzing resume format...",
  "Decoding PDF layout...",
  "Extracting contact information...",
  "Processing job titles...",
  "Reading employment dates...",
  "Identifying certifications...",
  "Scanning for keywords...",
  "Analyzing bullet points...",
  "Extracting project descriptions...",
  "Processing achievements...",
  "Reading technical skills section...",
  "Identifying programming languages...",
  "Extracting company names...",
  "Analyzing experience timeline...",
  "Processing education credentials...",
  "Reading degree information...",
  "Scanning for publications...",
  "Extracting volunteer experience...",
  "Analyzing resume sections...",
  "Processing soft skills mentions...",
  "Reading leadership experience...",
  "Identifying team sizes managed...",
  "Extracting metrics and numbers...",
  "Processing impact statements...",
  "Analyzing action verbs...",
  "Reading technology stack...",
  "Identifying frameworks mentioned...",
  "Extracting tools and platforms...",
  "Processing industry experience...",
  "Reading domain expertise...",
  "Analyzing career progression...",
  "Identifying promotions...",
  "Extracting responsibilities...",
  "Processing achievements vs duties...",
  "Reading between the lines...",
  "Identifying gaps in timeline...",
  "Analyzing job-hopping patterns...",
  "Processing career trajectory...",
  "Reading salary indicators...",
  "Identifying seniority level...",
  "Extracting management experience...",
  "Processing technical depth...",
  "Analyzing breadth of skills...",
  "Identifying unique experiences...",
  "Structuring parsed data...",
  "Organizing information...",
  "Validating extracted content...",
  "Final processing...",
  "Almost done parsing...",
];

interface LoadingMessagesProps {
  interval?: number;
  type?: 'interview' | 'resume-grill' | 'resume-upload';
}

export default function LoadingMessages({ interval = 2000, type = 'interview' }: LoadingMessagesProps) {
  const messages = type === 'resume-grill'
    ? RESUME_GRILL_MESSAGES
    : type === 'resume-upload'
    ? RESUME_UPLOAD_MESSAGES
    : INTERVIEW_MESSAGES;

  const [messageIndex, setMessageIndex] = useState(0);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex(() => {
        const availableIndices = messages
          .map((_, idx) => idx)
          .filter(idx => !usedIndices.has(idx));

        if (availableIndices.length === 0) {
          const newIndex = Math.floor(Math.random() * messages.length);
          setUsedIndices(new Set([newIndex]));
          return newIndex;
        }

        const newIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        setUsedIndices(prev => new Set([...prev, newIndex]));
        return newIndex;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [interval, usedIndices, messages]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
      <div className="fixed inset-0 z-0 bg-slate-100 dark:bg-slate-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-200/50 dark:bg-slate-700/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-zinc-200/40 dark:bg-slate-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 text-center max-w-md px-4">
        <div className="relative mb-12">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-blue-500 dark:bg-blue-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative w-24 h-24 rounded-full border-4 border-transparent bg-blue-500 dark:bg-blue-400 animate-spin" style={{ animationDuration: "3s" }}>
              <div className="absolute inset-1 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-blue-500 dark:bg-blue-400 rounded-full opacity-20 animate-ping" style={{ animationDuration: "2s" }}></div>
          </div>
        </div>

        <LiquidButton className="mb-6 w-auto max-w-full mx-auto px-8" size="xl">
          <span className="text-white text-lg font-medium transition-opacity duration-300 text-center whitespace-nowrap" key={messageIndex}>
            {messages[messageIndex]}
          </span>
        </LiquidButton>

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce shadow-lg shadow-blue-500/50"></div>
          <div className="w-3 h-3 bg-purple-500 dark:bg-purple-400 rounded-full animate-bounce shadow-lg shadow-purple-500/50" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-3 h-3 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce shadow-lg shadow-indigo-500/50" style={{ animationDelay: "0.2s" }}></div>
        </div>

        <div className="relative h-12 flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-500 dark:bg-blue-400 rounded-lg blur-lg opacity-10"></div>
          <p className="relative text-slate-600 dark:text-slate-400 text-sm backdrop-blur-sm bg-white/50 dark:bg-slate-900/50 py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 whitespace-nowrap">
            This usually takes 10-20 seconds
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
