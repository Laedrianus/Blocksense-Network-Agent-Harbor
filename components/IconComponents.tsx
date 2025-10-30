import React from 'react';

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const InformationCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const GitIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M22.25 11.25a2.25 2.25 0 00-2.25 2.25v.754a4.502 4.502 0 01-1.282 3.12l-3.374 3.374a4.5 4.5 0 01-5.75-.412l-.768-.768a.75.75 0 00-1.06 1.06l.768.768a6 6 0 007.667.55l3.374-3.374a6 6 0 001.71-4.16V13.5a2.25 2.25 0 00-2.25-2.25z" />
        <path d="M11.625 13.125a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
        <path d="M4.125 7.875a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
        <path d="M1.75 12a2.25 2.25 0 104.5 0 2.25 2.25 0 00-4.5 0z" />
        <path d="M1.75 11.25a.75.75 0 000 1.5h1.597a4.502 4.502 0 013.031-1.498 3.75 3.75 0 015.011-5.264.75.75 0 10-1.22-.882A2.25 2.25 0 008.25 6.75a3.001 3.001 0 00-2.121.879H1.75z" />
    </svg>
);

export const DockerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M2.25 2.25a.75.75 0 00-.75.75v18c0 .414.336.75.75.75h19.5a.75.75 0 00.75-.75V3a.75.75 0 00-.75-.75H2.25zM6.577 16.5c-.382 0-.695.385-.695.86s.313.86.695.86h1.636c.382 0 .695-.385.695-.86s-.313-.86-.695-.86H6.577zM9.638 16.5c-.382 0-.695.385-.695.86s.313.86.695.86h1.636c.382 0 .695-.385.695-.86s-.313-.86-.695-.86H9.638zM12.7 16.5c-.382 0-.695.385-.695.86s.313.86.695.86h1.636c.382 0 .695-.385.695-.86s-.313-.86-.695-.86H12.7zM6.577 13.82c-.382 0-.695.385-.695.86s.313.86.695.86h1.636c.382 0 .695-.385.695-.86s-.313-.86-.695-.86H6.577zM9.638 13.82c-.382 0-.695.385-.695.86s.313.86.695.86h1.636c.382 0 .695-.385.695-.86s-.313-.86-.695-.86H9.638zM6.577 11.14c-.382 0-.695.385-.695.86s.313.86.695.86h1.636c.382 0 .695-.385.695-.86s-.313-.86-.695-.86H6.577zM18.5 10.375c0-3.32-1.96-5.405-5.599-5.405H4.25v9.11h7.828c3.218 0 5.109-1.634 5.109-4.322V10.375zm-1.312 0c0 2.228-1.188 3.01-3.797 3.01H5.562V6.28h7.828c2.61 0 3.797.86 3.797 2.822v1.273z" clipRule="evenodd" />
    </svg>
);

export const NixIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M5.46 18.54l4.95-4.95-4.95-4.95L7.59 6.5l6.01 6.01-1.06 1.06L6.53 19.6l-1.07-1.06zM12.41 6.5l1.06 1.06-4.95 4.95 4.95 4.95-1.06 1.06-6.01-6.01 1.06-1.06L12.41 6.5z"/>
    </svg>
);

export const VscodeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M23.15 2.587L18.21.21a1.494 1.494 0 00-1.724.469L9.54 9.174l-6.42-2.731a1.494 1.494 0 00-1.54.2L.11 7.9a1.494 1.494 0 00-.11 2.053l4.544 5.048-4.544 5.048a1.494 1.494 0 00.11 2.053l1.47 1.254a1.494 1.494 0 001.54.2l6.42-2.731 6.946 8.495a1.494 1.494 0 001.724.469l4.94-2.377a1.494 1.494 0 00.85-1.942l-3.617-7.465 3.617-7.465a1.494 1.494 0 00-.85-1.942zm-5.063 12.47L11.5 8.331l3.503-1.49L19.44 15.06l-1.353-.003z" />
    </svg>
);

export const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.5 3A2.5 2.5 0 008 5.5v1.085a3.5 3.5 0 012.5-.96 3.5 3.5 0 012.5.96V5.5A2.5 2.5 0 0010.5 3zm-2.5 3.5v-.5a1 1 0 011-1h3a1 1 0 011 1v.5a2 2 0 11-5 0zm9.5 2A1.5 1.5 0 0016 7H5a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 005 20h11a1.5 1.5 0 001.5-1.5v-10z" clipRule="evenodd" />
    </svg>
);

export const ClipboardCheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.5 3A2.5 2.5 0 008 5.5v1.085a3.5 3.5 0 012.5-.96 3.5 3.5 0 012.5.96V5.5A2.5 2.5 0 0010.5 3zm-2.5 3.5v-.5a1 1 0 011-1h3a1 1 0 011 1v.5a2 2 0 11-5 0zm9.5 2A1.5 1.5 0 0016 7H5a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 005 20h11a1.5 1.5 0 001.5-1.5v-10zm-3.03 4.22a.75.75 0 00-1.06-1.06l-2.5 2.5a.75.75 0 001.06 1.06l2.5-2.5zm-7.5-1.5a.75.75 0 01.75.75v2c0 .414-.336.75-.75.75h-1.5a.75.75 0 010-1.5H6v-1.25a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
);


// Agent Logos
export const OpenHandsLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.5 10.7499C15.5 10.2299 15.07 9.74992 14.5 9.74992C13.93 9.74992 13.5 10.2299 13.5 10.7499V13.4399C13.5 13.9999 13.94 14.4399 14.5 14.4399C15.06 14.4399 15.5 13.9999 15.5 13.4399V10.7499Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.5 11.25V13.25C9.5 13.8 9.94 14.25 10.5 14.25C11.06 14.25 11.5 13.8 11.5 13.25V10.75C11.5 10.2 11.06 9.75 10.5 9.75C9.94 9.75 9.5 10.2 9.5 10.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.5 10.5C6.5 11.05 6.06 11.5 5.5 11.5C4.94 11.5 4.5 11.05 4.5 10.5V9.5C4.5 8.4 5.4 7.5 6.5 7.5C7.6 7.5 8.5 8.4 8.5 9.5V11.5C8.5 12.6 7.6 13.5 6.5 13.5C5.4 13.5 4.5 12.6 4.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18.5 10.5C18.5 9.4 19.4 8.5 20.5 8.5C21.6 8.5 22.5 9.4 22.5 10.5V14.5C22.5 17.26 20.26 19.5 17.5 19.5H15.5C12.74 19.5 10.5 17.26 10.5 14.5V13.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.5 9.5V11.5C8.5 12.6 7.6 13.5 6.5 13.5H5.5C3.24 13.5 1.5 11.76 1.5 9.5V8.5C1.5 5.74 3.74 3.5 6.5 3.5H7.5C10.26 3.5 12.5 5.74 12.5 8.5V10.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const OpenAILogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.288 15.352c.019-.114.038-.228.038-.342a4.816 4.816 0 0 0-4.813-4.813h-2.11v-1.428a4.816 4.816 0 0 0-4.813-4.813H8.76a4.816 4.816 0 0 0-4.813 4.813v2.11H2.52c-.114 0-.228.019-.342.038a4.816 4.816 0 0 0-2.14 9.29c.019.114.038.228.038.342a4.816 4.816 0 0 0 4.813 4.813h2.11v1.428a4.816 4.816 0 0 0 4.813 4.813h1.83a4.816 4.816 0 0 0 4.813-4.813v-2.11h1.428c.114 0 .228-.019.342-.038a4.816 4.816 0 0 0 2.14-9.29zM15.352 2.179a2.648 2.648 0 0 1 2.648 2.648v2.11h-1.428a4.816 4.816 0 0 0-4.813-4.813H8.76a2.648 2.648 0 0 1 2.648-2.648h1.83c.969 0 1.833.513 2.343 1.282zM2.179 8.648a2.648 2.648 0 0 1 2.648-2.648h2.11v1.428a4.816 4.816 0 0 0 4.813 4.813h5.712a2.648 2.648 0 0 1-2.648 2.648h-2.11v1.428a4.816 4.816 0 0 0-4.813 4.813H6.808a2.648 2.648 0 0 1-2.648-2.648v-2.11H2.52c-.969 0-1.833-.513-2.343-1.282a2.63 2.63 0 0 1-.038-.228zM8.648 21.821a2.648 2.648 0 0 1-2.648-2.648v-2.11h1.428a4.816 4.816 0 0 0 4.813 4.813h1.83a2.648 2.648 0 0 1-2.648 2.648h-2.11c-.969 0-1.833-.513-2.343-1.282.038.019.038.038.057.057zm13.173-6.469a2.648 2.648 0 0 1-2.648 2.648h-2.11v-1.428a4.816 4.816 0 0 0-4.813-4.813H6.5v-1.428a2.648 2.648 0 0 1 2.648-2.648h2.11v-1.428a4.816 4.816 0 0 0 4.813-4.813h.342a2.648 2.648 0 0 1 2.648 2.648v2.11h1.428c.969 0 1.833.513 2.343 1.282a2.63 2.63 0 0 1 .038.228z"/>
    </svg>
);

export const CopilotLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.002 0a11.87 11.87 0 00-3.666.65c-2.91.808-4.52 3.42-4.516 6.362.004 2.943 1.59 5.57 4.516 6.364a11.87 11.87 0 007.332 0c2.927-.793 4.512-3.42 4.516-6.364-.004-2.94-1.607-5.553-4.516-6.362A11.87 11.87 0 0012.002 0zm-.008 2.003c2.628 0 4.905.85 6.208 2.214 1.304 1.362 2.11 3.52 2.11 5.786 0 2.264-.807 4.423-2.11 5.785-1.303 1.363-3.58 2.214-6.208 2.214-2.63 0-4.905-.85-6.209-2.214-1.304-1.362-2.11-3.52-2.11-5.785 0-2.266.806-4.424 2.11-5.786C7.09 2.853 9.37 2.003 11.994 2.003zM4.78 6.136a5.034 5.034 0 000 11.73c2.72.03 4.88-2.18 4.88-4.883v-2.05c0-2.7-2.16-4.912-4.88-4.797zm14.448 0c-2.72-.115-4.88 2.096-4.88 4.797v2.05c0 2.704 2.16 4.913 4.88 4.883a5.034 5.034 0 000-11.73zM12 8.01a3.86 3.86 0 00-3.88 3.856c0 2.13 1.75 3.88 3.88 3.88s3.88-1.75 3.88-3.88c0-2.106-1.75-3.857-3.88-3.857z"/>
    </svg>
);

export const GooseAILogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.0001 8.5C14.0001 8.5 15.0001 7.5 16.5001 7.5C18.0001 7.5 19.0001 8.5 19.0001 10C19.0001 11.5 18.0001 12.5 16.5001 12.5C15.0001 12.5 14.0001 11.5 14.0001 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.28003 16.78C8.28003 16.78 6.50003 18 5.00003 17.2C3.50003 16.4 4.53003 14.5 4.53003 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16.5 7.5C16.5 4.74 14.26 2.5 11.5 2.5C8.74003 2.5 6.50003 4.74 6.50003 7.5C6.50003 9.44 7.61003 11.11 9.17003 11.85C9.53003 12.02 9.87003 12.23 10.18 12.47C10.74 12.9 11.23 13.39 11.64 13.93C12.18 14.64 12.5001 15.48 12.5001 16.5C12.5001 17.55 12.1501 18.54 11.5501 19.34C10.9501 20.14 10.1401 20.76 9.24006 21.12C8.35006 21.48 7.39006 21.58 6.46006 21.41C5.53006 21.24 4.67006 20.81 4.00006 20.18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const JulesLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 6C17 6 15.5 5 13.5 5C11.5 5 10 6.5 10 8.5V14.5C10 16.5 11 18.5 13.5 18.5C16 18.5 17 16.5 17 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 16H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);