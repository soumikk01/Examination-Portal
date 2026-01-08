import React from 'react';

const DecorativeCircle = ({
    width,
    height,
    gradient,
    top,
    left,
    bottom,
    right,
    opacity = 1,
    zIndex = 0,
    blur = '0px',
    shadow = 'none',
    style = {}
}) => {
    return (
        <div
            style={{
                position: 'absolute',
                top,
                left,
                bottom,
                right,
                width,
                height,
                background: gradient,
                borderRadius: '50%',
                filter: blur !== '0px' ? `blur(${blur})` : 'none',
                boxShadow: shadow,
                opacity,
                zIndex,
                pointerEvents: 'none',
                ...style,
            }}
        />
    );
};

export default DecorativeCircle;
