/**
 * Chinese Astrology Calculation Engine (Bazi / Bazi-elements)
 * Contains:
 * 1. Chinese Zodiac & Stem Element calculation based on Li Chun (Solar year boundary).
 * 2. Tai Sui Clash (ปีชง) scanner for 2026 (Year of the Horse).
 * 3. 5-Elements Compatibility (สมพงษ์คู่ธาตุจีน).
 * 4. Prediction databases for Chinese Zodiac and Elements.
 */

const ChineseAstrology = {
  // 12 Animals
  ANIMALS: [
    { name: 'ชวด', eng: 'Rat', element: 'น้ำ', yingyang: 'หยาง', traits: 'เฉลียวฉลาด ไหวพริบปฏิภาณดีเลิศ ปรับตัวเก่ง ขยันขันแข็งในการสะสมเงินทอง แต่บางครั้งใจร้อนหรือตระหนี่' },
    { name: 'ฉลู', eng: 'Ox', element: 'ดิน', yingyang: 'หยิน', traits: 'หนักแน่น อดทน ซื่อสัตย์ มีระเบียบวินัย ทำงานหนักอย่างสม่ำเสมอ แต่บางครั้งหัวโบราณหรือดื้อรั้น' },
    { name: 'ขาล', eng: 'Tiger', element: 'ไม้', yingyang: 'หยาง', traits: 'กล้าหาญ เด็ดเดี่ยว มีบารมีดึงดูดสายตาคนรอบข้าง รักอิสระและเปี่ยมความทะเยอทะยาน แต่อาจใช้อารมณ์เหนือกฎเกณฑ์' },
    { name: 'เถาะ', eng: 'Rabbit', element: 'ไม้', yingyang: 'หยิน', traits: 'อ่อนโยน มีมารยาท รักสงบ อ่อนไหวง่าย มักชอบหลีกเลี่ยงความขัดแย้ง ช่างเอาใจใส่ แต่บางครั้งอาจขี้กลัวหรือไม่เด็ดขาด' },
    { name: 'มะโรง', eng: 'Dragon', element: 'ดิน', yingyang: 'หยาง', traits: 'ทรงพลัง มีบารมี สง่างาม ทะนงตน มีความกระตือรือร้นและรักความยุติธรรมสูงสุด แต่อาจดื้อรั้นและชอบความสมบูรณ์แบบเกินไป' },
    { name: 'มะเส็ง', eng: 'Snake', element: 'ไฟ', yingyang: 'หยิน', traits: 'ลึกลับ มีลางสังหรณ์ดีเลิศ เฉลียวฉลาดแบบสงบ มีเสน่ห์ทางดึงดูดใจ รักความปลอดภัย แต่อาจหวงแหนและระแวดระวังตัวมากเกินไป' },
    { name: 'มะเมีย', eng: 'Horse', element: 'ไฟ', yingyang: 'หยาง', traits: 'รักอิสระ ร่าเริง อารมณ์ดี ชอบเข้าสังคม มีพลังล้นเหลือในการทำงานรวดเร็ว แต่อาจขาดความอดทนระยะยาวและสมาธิสั้น' },
    { name: 'มะแม', eng: 'Goat', element: 'ดิน', yingyang: 'หยิน', traits: 'มีเมตตา รักสันติภาพ มีรสนิยมด้านศิลปะ อ่อนน้อมถ่อมตนและเห็นอกเห็นใจผู้อื่น แต่ค่อนข้างคิดมากหรือวิตกกังวลสะสม' },
    { name: 'วอก', eng: 'Monkey', element: 'ทอง', yingyang: 'หยาง', traits: 'ขี้เล่น ว่องไว ช่างเจรจา มีไหวพริบแก้ปัญหาเฉพาะหน้าเก่งมาก เรียนรู้อะไรได้ไว แต่อาจขาดความจริงจังหรือชอบเล่นตลกเกินควร' },
    { name: 'ระกา', eng: 'Rooster', element: 'ทอง', yingyang: 'หยิน', traits: 'ละเอียดลออ ช่างสังเกต มั่นใจในตัวเอง ชอบแต่งตัวและพูดจาตรงไปตรงมา รักความจริงใจ แต่อาจชอบสั่งการหรือขี้ระแวง' },
    { name: 'จอ', eng: 'Dog', element: 'ดิน', yingyang: 'หยาง', traits: 'ซื่อสัตย์ รักความยุติธรรม รักพวกพ้องและครอบครัวอย่างสูงสุด พร้อมปกป้องสิทธิ์ผู้อื่น แต่บางครั้งอาจหัวร้อนขี้กังวล' },
    { name: 'กุน', eng: 'Pig', element: 'น้ำ', yingyang: 'หยิน', traits: 'ใจกว้าง ซื่อตรง รักความสงบและอาหารอร่อย ชอบช่วยเหลือจุนเจือผู้อื่น อารมณ์เย็นและพึ่งพาได้ แต่อาจใจอ่อนเกินไปจนโดนหลอก' }
  ],

  // 5 Stems Elements
  ELEMENTS: {
    'ไม้': { name: 'ธาตุไม้', color: '#2ed573', relation: 'การเติบโต การสร้างสรรค์ และความมีเมตตากรุณา', traits: 'เปรียบเสมือนต้นไม้ใหญ่ มีจิตใจโอบอ้อมอารี ชอบช่วยเหลือคน รักการเติบโตและเรียนรู้ตลอดเวลา ปรับตัวได้ราบรื่นดั่งกิ่งไม้' },
    'ไฟ': { name: 'ธาตุไฟ', color: '#ff4757', relation: 'ความร้อนแรง พลังงานสร้างสรรค์ และเกียรติยศ', traits: 'เปรียบเสมือนแสงอาทิตย์หรือกองไฟ อบอุ่น มีเสน่ห์ กระตือรือร้น รักเกียรติและศักดิ์ศรี แต่อาจใจร้อน วู่วาม และพูดจาตรงเกินไป' },
    'ดิน': { name: 'ธาตุดิน', color: '#ffa502', relation: 'ความมั่นคง ปลอดภัย และการสะสมกตัญญู', traits: 'เปรียบเสมือนขุนเขา หนักแน่น น่าเชื่อถือ พึ่งพาอาศัยได้ดีเยี่ยม รักครอบครัวและกตัญญูสูง แต่อาจหัวแข็ง ดื้อรั้น ไม่ชอบการเปลี่ยนทางกะทันหัน' },
    'ทอง': { name: 'ธาตุทอง', color: '#ffd700', relation: 'ความเฉียบคม ความยุติธรรม และอำนาจตัดสินใจ', traits: 'เปรียบเสมือนดาบหรือทองคำบริสุทธิ์ เด็ดขาด เฉียบแหลม รักความถูกต้องและเป็นธรรม มีวินัยสูง แต่อาจเย็นชาหรือแข็งกระด้างในบางสถานการณ์' },
    'น้ำ': { name: 'ธาตุน้ำ', color: '#00f2fe', relation: 'ความลื่นไหล ปัญญาญาณ และการเดินทางไกล', traits: 'เปรียบเสมือนสายน้ำ ลื่นไหล ปรับตัวเก่ง มีปัญญาไหวพริบลึกซึ้ง ชอบเดินทางเรียนรู้สิ่งแปลกใหม่ รักอิสระ แต่อาจอารมณ์เปลี่ยนแปลงง่ายตามสิ่งแวดล้อม' }
  },

  /**
   * Calculate Astrological Chinese Zodiac Year (Accounting for Li Chun - ~Feb 4)
   */
  getChineseYearDetails: function(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    let astYear = year;
    // Li Chun (สารทฤดูใบไม้ผลิ) is typically on Feb 4.
    // If born before Feb 4, the birth year belongs to the previous Chinese solar year.
    if (month < 2 || (month === 2 && day < 4)) {
      astYear--;
    }

    // Reference: Year 1984 (Rat - 0)
    // Formula: (astYear - 4) % 12
    let animalIdx = (astYear - 4) % 12;
    if (animalIdx < 0) animalIdx += 12;

    // Heavenly Stem Element (Ending digit of astYear)
    // 4, 5 -> Wood (ไม้)
    // 6, 7 -> Fire (ไฟ)
    // 8, 9 -> Earth (ดิน)
    // 0, 1 -> Metal (ทอง)
    // 2, 3 -> Water (น้ำ)
    const stemDigit = astYear % 10;
    let element = '';
    if (stemDigit === 4 || stemDigit === 5) element = 'ไม้';
    else if (stemDigit === 6 || stemDigit === 7) element = 'ไฟ';
    else if (stemDigit === 8 || stemDigit === 9) element = 'ดิน';
    else if (stemDigit === 0 || stemDigit === 1) element = 'ทอง';
    else if (stemDigit === 2 || stemDigit === 3) element = 'น้ำ';

    return {
      astYear: astYear,
      animalIdx: animalIdx,
      animalName: this.ANIMALS[animalIdx].name,
      animalEng: this.ANIMALS[animalIdx].eng,
      element: element,
      traits: this.ANIMALS[animalIdx].traits,
      elementTraits: this.ELEMENTS[element].traits
    };
  },

  /**
   * Determine Clash Status with Current Year (2026 - Year of the Fire Horse)
   * 0: Rat, 1: Ox, 2: Tiger, 3: Rabbit, 4: Dragon, 5: Snake, 6: Horse, 7: Goat, 8: Monkey, 9: Rooster, 10: Dog, 11: Pig
   */
  checkTaiSuiClash: function(animalIdx) {
    // Current year is 2026: Horse (ปีมะเมีย - 6)
    if (animalIdx === 0) {
      return {
        status: 'ชง 100%',
        class: 'clash-100',
        desc: '<strong>ชงโดยตรง (100%):</strong> ปีมะเมียขัดแย้งกับปีชวดโดยสิ้นเชิง ส่งผลให้ปีนี้อาจมีเกณฑ์เจอกระแสพลังปะทะอย่างรุนแรง การเงินผันผวนบ่อยครั้ง มีอุปสรรคขัดขวางไม่คาดฝัน การเดินทางต้องระมัดระวังสูงสุด',
        remedy: 'แนะนำให้ไปทำพิธีสะเดาะเคราะห์ฝากดวงชะตากับองค์ไท้ส่วยเอี๊ย ณ วัดเล่งเน่ยยี่ หรือวัดจีนมงคล พร้อมทำบุญปล่อยชีวิตสัตว์เป็นทานเพื่อบรรเทากระแสปะทะ'
      };
    }
    
    if (animalIdx === 6) {
      return {
        status: 'ชงร่วม (คัก)',
        class: 'clash-co',
        desc: '<strong>ปีชงร่วม คัก (ปีตัวเอง):</strong> ทับปีนักษัตรดั้งเดิม ส่งผลให้จิตใจอาจว้าวุ่น เครียดสะสม หรือเกิดความรู้สึกติดขัดสับสนในการตัดสินใจ การก้าวเดินกะทันหันอาจมีข้อผิดพลาดง่าย',
        remedy: 'แนะนำไหว้พระแก้วมรกตหรือศาลหลักเมือง ทำบุญถวายกระเบื้องมุงหลังคาโบสถ์เพื่อสร้างเกราะกำบังดวงชะตา'
      };
    }

    if (animalIdx === 9) {
      return {
        status: 'ชงร่วม (เฮ้ง)',
        class: 'clash-co',
        desc: '<strong>ปีชงร่วม เฮ้ง (เบียดเบียน/ลงโทษ):</strong> ระวังเรื่องของคดีความ การมีปัญหากับผู้มีอิทธิพล หรือถูกหักหลังเอารัดเอาเปรียบจากหุ้นส่วนมิตรสหาย',
        remedy: 'แนะนำถวายหลอดไฟ เติมน้ำมันตะเกียง หรือบริจาคเงินช่วยซื้ออุปกรณ์การแพทย์เพื่อผ่อนปรนเคราะห์ดาวปะทะ'
      };
    }

    if (animalIdx === 3) {
      return {
        status: 'ชงร่วม (ผั่ว)',
        class: 'clash-co',
        desc: '<strong>ปีชงร่วม ผั่ว (พังทลาย/แตกร้าว):</strong> ระวังปัญหาสุขภาพของตนเองและคนในครอบครัว ความรักอาจมีเรื่องแตกร้าวระหองระแหง ความสัมพันธ์ไม่ราบรื่น',
        remedy: 'แนะนำทำบุญบริจาคโลงศพ ทำบุญโลงศพมูลนิธิ หรือไถ่ชีวิตโคกระบือเพื่อสะสมบารมีคุ้มชะตา'
      };
    }

    // Auspicious harmonious relationships (ฮะ / Friends of Horse)
    if (animalIdx === 7 || animalIdx === 2 || animalIdx === 10) {
      let friendDesc = '';
      if (animalIdx === 7) friendDesc = '<strong>คู่สมพงษ์หลัก (มะแม):</strong> ปีนี้ดวงชะตาของคุณจะได้รับการส่งเสริมเกื้อกูลเป็นพิเศษจากพลังงานมงคลปีมะเมีย ประสบความสำเร็จอย่างโดดเด่น';
      if (animalIdx === 2) friendDesc = '<strong>สามสมพงษ์ (ขาล):</strong> มีความเกื้อหนุนหนุนดวงชะตาในการเจรจา การติดต่อต่างแดน ค้าขายมีกำไรดี';
      if (animalIdx === 10) friendDesc = '<strong>สามสมพงษ์ (จอ):</strong> ผู้ใหญ่เอ็นดูเมตตา คอยหนุนนำดึงชะตาให้พ้นจากขีดจำกัด ประสบความสำเร็จมั่นคง';

      return {
        status: 'ปีมิตรเกื้อหนุน (ปีฮะ)',
        class: 'clash-harmony',
        desc: friendDesc,
        remedy: 'แนะนำให้หาจังหวะขยายธุรกิจ เริ่มงานใหม่ หรือริเริ่มโปรเจกต์มงคล และเสริมดวงด้วยการทำทานตักบาตรเช้าอย่างสม่ำเสมอ'
      };
    }

    // General Neutral
    return {
      status: 'ดวงชะตาราบเรียบปกติ',
      class: 'clash-neutral',
      desc: '<strong>ดวงชะตาปานกลางราบเรียบ:</strong> ปีมะเมียส่งผลดีหรือผลกระทบระดับปานกลาง ไม่มีพลังงานปะทะรุนแรงแต่อย่างใด ชีวิตก้าวเดินได้ตามปกติวิสัย',
      remedy: 'แนะนำทำบุญไหว้พระประธานปางสมาธิ สวดมนต์นั่งสมาธิสัปดาห์ละครั้งเพื่อสร้างพลังสติปัญญาหนุนทางชีวิตให้เจริญรุ่งเรือง'
    };
  },

  /**
   * Five Elements Chinese Compatibility
   */
  getElementCompatibility: function(elem1, elem2) {
    // Supportive generation cycle: Wood -> Fire -> Earth -> Metal -> Water -> Wood
    const generation = {
      'ไม้': 'ไฟ',
      'ไฟ': 'ดิน',
      'ดิน': 'ทอง',
      'ทอง': 'น้ำ',
      'น้ำ': 'ไม้'
    };

    // Destructive controlling cycle: Wood -> Earth -> Water -> Fire -> Metal -> Wood
    const control = {
      'ไม้': 'ดิน',
      'ดิน': 'น้ำ',
      'น้ำ': 'ไฟ',
      'ไฟ': 'ทอง',
      'ทอง': 'ไม้'
    };

    if (elem1 === elem2) {
      return {
        status: 'ธาตุเหมือนเกื้อหนุนกัน',
        score: 85,
        desc: `ธาตุ <strong>${elem1}</strong> และ <strong>${elem2}</strong> เป็นธาตุเดียวกัน เปรียบเหมือนพลังงานคู่ขนานส่งเสริมซึ่งกันและกัน มีทัศนคติ การตัดสินใจ และจินตนาการใกล้เคียงกัน เข้าใจและประคองชีวิตคู่ร่วมกันได้ราบรื่นราบเรียบ`
      };
    }

    if (generation[elem1] === elem2) {
      return {
        status: 'คู่ธาตุเอื้อเฟื้อส่งเสริม (ดีเยี่ยม)',
        score: 95,
        desc: `ธาตุ <strong>${elem1}</strong> ส่งเสริมเกื้อหนุนธาตุ <strong>${elem2}</strong> (เปรียบดั่ง ${elem1} เป็นผู้ให้พลังกำเนิดชูชุบ ${elem2} เช่น ${elem1 === 'ไม้' ? 'ไม้เป็นฟืนป้อนไฟ' : elem1 === 'ไฟ' ? 'ไฟเผาหลอมเป็นผืนดิน' : elem1 === 'ดิน' ? 'ดินกลั่นกรองเกิดแร่ทอง' : elem1 === 'ทอง' ? 'ทองละลายหลั่งเป็นสายน้ำ' : 'น้ำหล่อเลี้ยงต้นไม้'}) ฝ่ายแรกจะเป็นผู้คอยสนับสนุน เสียสละ และมอบความอบอุ่นให้อีกฝ่ายอย่างสูงสุด รักกันราบรื่นมั่นคงพูนสุข`
      };
    }

    if (generation[elem2] === elem1) {
      return {
        status: 'คู่ธาตุเกื้อหนุนถ้อยทีถ้อยอาศัย (ดีเยี่ยม)',
        score: 95,
        desc: `ธาตุ <strong>${elem2}</strong> ส่งเสริมเกื้อหนุนธาตุ <strong>${elem1}</strong> (เปรียบดั่ง ${elem2} มอบพลังป้อนน้ำเลี้ยงให้แก่ ${elem1}) ทั้งสองฝ่ายอยู่ร่วมกันแล้วเกิดผลลัพธ์มงคล มีความอบอุ่นใจ พึ่งพาอาศัยซึ่งกันและกันได้อย่างลงตัวสูงสุดในการสร้างครอบครัว`
      };
    }

    if (control[elem1] === elem2) {
      return {
        status: 'ธาตุควบคุม/ข่มกัน (ต้องระวัง)',
        score: 45,
        desc: `ธาตุ <strong>${elem1}</strong> ทำการข่มควบคุมธาตุ <strong>${elem2}</strong> (เปรียบดั่ง ${elem1} เข้าควบคุมหรือลดทอนขีดจำกัดพลังของ ${elem2} เช่น ${elem1 === 'ไม้' ? 'ไม้ชอนไชผืนดิน' : elem1 === 'ดิน' ? 'ดินกั้นดูดซับกระแสน้ำ' : elem1 === 'น้ำ' ? 'น้ำดับไฟให้มอดดับ' : elem1 === 'ไฟ' ? 'ไฟเผาหลอมเนื้อทองคำ' : 'ทองคมตัดโค่นไม้ใหญ่'}) ส่งผลให้ชีวิตคู่อาจเกิดความรู้สึกอึดอัด ถูกควบคุม หรือขัดแย้งเชิงความคิดเห็นบ่อยครั้ง ต้องอาศัยความเข้าใจและยอมลดทิฐิใส่กัน`
      };
    }

    if (control[elem2] === elem1) {
      return {
        status: 'ธาตุพึ่งพาข่มจำกัด (ต้องระวัง)',
        score: 45,
        desc: `ธาตุ <strong>${elem2}</strong> ทำการข่มควบคุมธาตุ <strong>${elem1}</strong> (อีกฝ่ายควบคุมดวงของคุณอยู่) อาจมีฝ่ายใดฝ่ายหนึ่งรู้สึกโดนเอาเปรียบ ขาดความเป็นอิสระ หรือมีความขัดแย้งเรื่องการเงินและการตัดสินใจหลักบ่อยครั้ง ต้องประนีประนอมอย่างยิ่ง`
      };
    }

    // Default Fallback (Moderate)
    return {
      status: 'คู่ธาตุปานกลางสมดุล',
      score: 65,
      desc: `ธาตุ <strong>${elem1}</strong> และ <strong>${elem2}</strong> เป็นคู่ธาตุระดับปานกลาง อยู่ร่วมกันได้โดยไม่มีพลังปะทะรุนแรงและไม่ได้หนุนนำเด่นชัด อาศัยความเข้าใจ นิสัยใจคอส่วนบุคคล และการปรับตัวที่ดีจะสามารถสร้างความสุขความมั่นคงร่วมกันได้ดี`
    };
  // Elements Array for BaZi
  STEMS: [
    { name: 'เจี่ย', element: 'ไม้', polarity: 'หยาง', color: '#2ed573', pinyin: 'Jia' },
    { name: 'อี่', element: 'ไม้', polarity: 'หยิน', color: '#7bed9f', pinyin: 'Yi' },
    { name: 'ปิ่ง', element: 'ไฟ', polarity: 'หยาง', color: '#ff4757', pinyin: 'Bing' },
    { name: 'ติง', element: 'ไฟ', polarity: 'หยิน', color: '#ff7f50', pinyin: 'Ding' },
    { name: 'โบ่ว', element: 'ดิน', polarity: 'หยาง', color: '#ffa502', pinyin: 'Wu' },
    { name: 'จี่', element: 'ดิน', polarity: 'หยิน', color: '#eccc68', pinyin: 'Ji' },
    { name: 'เกิง', element: 'ทอง', polarity: 'หยาง', color: '#ffd700', pinyin: 'Geng' },
    { name: 'ซิน', element: 'ทอง', polarity: 'หยิน', color: '#f1f2f6', pinyin: 'Xin' },
    { name: 'เหริน', element: 'น้ำ', polarity: 'หยาง', color: '#1e90ff', pinyin: 'Ren' },
    { name: 'กุ่ย', element: 'น้ำ', polarity: 'หยิน', color: '#70a1ff', pinyin: 'Gui' }
  ],

  BRANCHES: [
    { name: 'จื่อ', animal: 'ชวด', pinyin: 'Zi' },
    { name: 'โฉ่ว', animal: 'ฉลู', pinyin: 'Chou' },
    { name: 'อิ๋น', animal: 'ขาล', pinyin: 'Yin' },
    { name: 'เหม่า', animal: 'เถาะ', pinyin: 'Mao' },
    { name: 'เฉิน', animal: 'มะโรง', pinyin: 'Chen' },
    { name: 'ซื่อ', animal: 'มะเส็ง', pinyin: 'Si' },
    { name: 'อู่', animal: 'มะเมีย', pinyin: 'Wu' },
    { name: 'เว่ย', animal: 'มะแม', pinyin: 'Wei' },
    { name: 'เซิน', animal: 'วอก', pinyin: 'Shen' },
    { name: 'โหย่ว', animal: 'ระกา', pinyin: 'You' },
    { name: 'ซวี', animal: 'จอ', pinyin: 'Xu' },
    { name: 'ไฮ่', animal: 'กุน', pinyin: 'Hai' }
  ],

  /**
   * Calculate BaZi (4 Pillars of Destiny)
   */
  calculateBaZi: function(dateStr, timeStr) {
    if (!window.ThaiAstrology) {
      console.error("ChineseAstrology requires ThaiAstrology math library for Solar Terms.");
      return null;
    }

    const date = new Date(`${dateStr}T${timeStr}:00+07:00`); // Bangkok Time
    const jd = window.ThaiAstrology.AstroMath.getJulianDay(date);

    // 1. Month Pillar (Depends on Solar Terms)
    const sunTrop = window.ThaiAstrology.AstroMath.getSunLongitude(jd);
    // Solar terms start at 315 deg (Li Chun / Tiger Month)
    let monthIdx = Math.floor((sunTrop + 45) % 360 / 30); 
    const monthBranchIdx = (monthIdx + 2) % 12;

    // 2. Year Pillar
    // If we are in solar month index 10, 11 (Capricorn/Aquarius before Li Chun), it belongs to the previous Chinese Solar Year.
    let astYear = date.getFullYear();
    // monthIdx 0 is Tiger (Feb). monthIdx 11 is Ox (Jan). monthIdx 10 is Rat (Dec).
    // Actually, monthIdx calculation: sunTrop=315 -> monthIdx=0 (Tiger).
    // If sunTrop < 315 and sunTrop >= 255 (Winter solstice to Li Chun), it's the previous year.
    if (sunTrop < 315 && date.getMonth() < 3) {
      astYear -= 1;
    }
    
    let yearStemIdx = (astYear - 4) % 10;
    if (yearStemIdx < 0) yearStemIdx += 10;
    
    let yearBranchIdx = (astYear - 4) % 12;
    if (yearBranchIdx < 0) yearBranchIdx += 12;

    // Month Stem (Rule of 5 Tigers)
    // Jia/Ji (0, 5) -> Bing (2)
    // Yi/Geng (1, 6) -> Wu (4)
    let monthStemStart = ((yearStemIdx % 5) * 2 + 2) % 10;
    let monthStemIdx = (monthStemStart + monthIdx) % 10;

    // 3. Day Pillar
    // JD 2451545.0 (Jan 1 2000 12:00 UT) was Wu Wu (Earth Horse).
    // Calculate local days since then.
    let hh = date.getHours();
    let localJD = Math.floor(jd + 0.5 + 7/24);
    // Chinese day starts at 23:00 (Zi hour)
    if (hh >= 23) {
      localJD += 1;
    }

    let diffDays = (localJD - 2451545) % 60;
    if (diffDays < 0) diffDays += 60;

    // Jan 1 2000 was Day Stem 4 (Wu), Branch 6 (Wu)
    let dayStemIdx = (4 + diffDays) % 10;
    let dayBranchIdx = (6 + diffDays) % 12;

    // 4. Hour Pillar
    // 23-01 = 0, 01-03 = 1, ...
    let hourBranchIdx = Math.floor((hh + 1) / 2) % 12;
    
    // Hour Stem (Rule of 5 Rats)
    // Jia/Ji (0, 5) -> Jia (0)
    let hourStemStart = ((dayStemIdx % 5) * 2) % 10;
    let hourStemIdx = (hourStemStart + hourBranchIdx) % 10;

    return {
      year: { stem: this.STEMS[yearStemIdx], branch: this.BRANCHES[yearBranchIdx] },
      month: { stem: this.STEMS[monthStemIdx], branch: this.BRANCHES[monthBranchIdx] },
      day: { stem: this.STEMS[dayStemIdx], branch: this.BRANCHES[dayBranchIdx] },
      hour: { stem: this.STEMS[hourStemIdx], branch: this.BRANCHES[hourBranchIdx] }
    };
  },

  /**
   * Get Day Master Reading
   */
  getDayMasterReading: function(stemIdx) {
    const readings = [
      "<strong>เจี่ย (ไม้หยาง):</strong> คุณเปรียบเสมือนต้นไม้ใหญ่ แข็งแกร่ง มั่นคง เป็นที่พึ่งพาได้ ทะเยอทะยานและมีเป้าหมายชัดเจน แต่อาจดื้อรั้นหักโค่นได้ง่ายหากถูกบีบคั้น",
      "<strong>อี่ (ไม้หยิน):</strong> คุณเปรียบเสมือนไม้เลื้อยหรือดอกไม้ อ่อนโยน ยืดหยุ่น ปรับตัวเก่ง เอาตัวรอดได้ในทุกสถานการณ์ มีความประนีประนอมสูง",
      "<strong>ปิ่ง (ไฟหยาง):</strong> คุณเปรียบเสมือนดวงอาทิตย์ อบอุ่น มีพลัง เจิดจ้า เปิดเผย ตรงไปตรงมา ชอบช่วยเหลือผู้อื่น แต่อาจวู่วามและใจร้อน",
      "<strong>ติง (ไฟหยิน):</strong> คุณเปรียบเสมือนแสงเทียนหรือดวงดาว ละเอียดอ่อน ลึกลับ มีแรงบันดาลใจ มีเสน่ห์ดึงดูด ช่างคิดและมักซ่อนความรู้สึกไว้ลึกๆ",
      "<strong>โบ่ว (ดินหยาง):</strong> คุณเปรียบเสมือนภูเขา หนักแน่น อดทน มั่นคง วางใจได้ รักษาสัญญา แต่บางครั้งอาจหัวเก่า ไม่ยอมรับการเปลี่ยนแปลง",
      "<strong>จี่ (ดินหยิน):</strong> คุณเปรียบเสมือนดินเพาะปลูก อุดมสมบูรณ์ โอบอ้อมอารี เลี้ยงดูและสนับสนุนผู้อื่นได้ดี มีพรสวรรค์ในการบริหารจัดการสิ่งรอบตัว",
      "<strong>เกิง (ทองหยาง):</strong> คุณเปรียบเสมือนดาบหรือโลหะดิบ แข็งแกร่ง เด็ดขาด ยุติธรรม กล้าหาญ รักพวกพ้อง แต่อาจแข็งกร้าวและไม่ยอมคน",
      "<strong>ซิน (ทองหยิน):</strong> คุณเปรียบเสมือนเครื่องประดับหรือทองคำ หรูหรา มีระดับ รักความสมบูรณ์แบบ อ่อนไหวและมีทิฐิสูง ชอบสิ่งที่สวยงามและประณีต",
      "<strong>เหริน (น้ำหยาง):</strong> คุณเปรียบเสมือนมหาสมุทรหรือแม่น้ำใหญ่ กว้างขวาง พลังล้นเหลือ ลื่นไหล คาดเดายาก มีวิสัยทัศน์กว้างไกล แต่อาจอารมณ์แปรปรวนรุนแรง",
      "<strong>กุ่ย (น้ำหยิน):</strong> คุณเปรียบเสมือนน้ำค้างหรือสายฝน อ่อนโยน ละมุนละไม มีจิตนาการสูง ลึกลับ เข้าอกเข้าใจผู้อื่น แต่มักคิดมากและขี้กังวล"
    ];
    return readings[stemIdx] || "";
  }
};

// Export for browser
if (typeof window !== 'undefined') {
  window.ChineseAstrology = ChineseAstrology;
}
