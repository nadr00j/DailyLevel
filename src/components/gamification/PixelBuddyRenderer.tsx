import React from 'react';
import { motion } from 'framer-motion';
import { usePixelBuddyStore } from '@/stores/usePixelBuddyStore';

interface LayerStyle {
  width?: string;
  height?: string;
  marginTop?: string;
  marginLeft?: string;
}

// Ajustes manuais por camada (pode vir de manifest futuramente)
const layerStyles: Record<string, LayerStyle> = {
  body: {
    width: '85%',
    height: '85%',
    marginTop: '30px'
  },
  head: {
    width: '80%',
    height: '80%',
    marginTop: '-12px',
    marginLeft: '4px'
  },
  clothes: {
    width: '100%',
    height: '100%',
    marginTop: '20px',
    marginLeft: '-9px'
  },
  accessory: {
    width: '70%',
    height: '70%',
    marginTop: '-2px',
    marginLeft: '11px'
  },
  hat: {
    width: '90%',
    height: '90%',
    marginTop: '-44px',
    marginLeft: '-3px'
  }
  // clothes, accessory, hat, effect: default 100%
};

export const PixelBuddyRenderer: React.FC<{ size?: number }> = ({ size = 128 }) => {
  const { body, head, clothes, accessory, hat, effect } = usePixelBuddyStore();

  const layers: Array<{ src: string | null; key: string }> = [
    { src: clothes?.includes('clothes_suit') ? null : body, key: 'body' },
    { src: clothes, key: 'clothes' },
    { src: head, key: 'head' },
    { src: accessory, key: 'accessory' },
    { src: hat, key: 'hat' },
    { src: effect, key: 'effect' }
  ];

  return (
    <div
      className="relative select-none"
      style={{ width: size, height: size }}
    >
      {layers.map(({ src, key }) =>
        src ? (
          <motion.img
            key={key}
            src={src}
            alt={key}
            className="absolute inset-0"
            style={{
              width: key==='clothes' && src.includes('clothes_regata') ? 
                     (body?.includes('body_lvl3') ? '85%' : '90%') :
                     key==='clothes' && src.includes('clothes_tshirt') ? 
                     (body?.includes('body_lvl2') ? '102%' : '90%') :
                     key==='clothes' && src.includes('clothes_jacket') ? '90%' :
                     key==='body' && src.includes('body_lvl1') ? 
                     (clothes?.includes('clothes_regata') ? '100%' : '90%') :
                     key==='body' && src.includes('body_lvl3') ? '75%' :
                     (layerStyles[key]?.width || '100%'),
              height: key==='clothes' && src.includes('clothes_regata') ? 
                      (body?.includes('body_lvl3') ? '85%' : '90%') :
                      key==='clothes' && src.includes('clothes_tshirt') ? 
                      (body?.includes('body_lvl2') ? '95%' : '90%') :
                      key==='clothes' && src.includes('clothes_jacket') ? '90%' :
                      key==='body' && src.includes('body_lvl1') ? 
                      (clothes?.includes('clothes_regata') ? '85%' : '85%') :
                      key==='body' && src.includes('body_lvl3') ? '85%' :
                      (layerStyles[key]?.height || '100%'),
              marginTop: key==='clothes' && src.includes('clothes_regata') ? 
                        (body?.includes('body_lvl3') ? '37px' : '34px') :
                        key==='clothes' && src.includes('clothes_tshirt') ? 
                        (body?.includes('body_lvl2') ? '23px' : '26px') :
                        key==='clothes' && src.includes('clothes_jacket') ? '30px' :
                        key==='body' && src.includes('body_lvl1') ? 
                        (clothes?.includes('clothes_regata') ? '30px' : '30px') :
                        key==='body' && src.includes('body_lvl3') ? '30px' :
                        key==='hat' && src.includes('hat_top_hat') ? '-59px' :
                        layerStyles[key]?.marginTop,
              marginLeft: key==='clothes' && src.includes('clothes_regata') ? 
                         (body?.includes('body_lvl3') ? '0px' : '-2px') :
                         key==='clothes' && src.includes('clothes_tshirt') ? 
                         (body?.includes('body_lvl2') ? '-9px' : '-2px') :
                         key==='clothes' && src.includes('clothes_jacket') ? '-2px' :
                         key==='body' && src.includes('body_lvl1') ? 
                         (clothes?.includes('clothes_regata') ? '-8px' : '-2px') :
                         key==='body' && src.includes('body_lvl3') ? '7px' :
                         layerStyles[key]?.marginLeft
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            draggable={false}
          />
        ) : null
      )}
    </div>
  );
};
